<?php
// Suppress PHP warnings/notices from polluting the JSON output
ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');
session_start();
include 'db_config.php';

// ── Auth ──────────────────────────────────────────────────────────
if (!isset($_SESSION['email'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized — please log in']);
    exit;
}

$email = $_SESSION['email'];

$stu = $conn->prepare("SELECT id FROM students WHERE email = ? LIMIT 1");
$stu->bind_param("s", $email);
$stu->execute();
$row = $stu->get_result()->fetch_assoc();

if (!$row) {
    echo json_encode(['success' => false, 'message' => 'Student record not found for: ' . $email]);
    exit;
}
$student_id = $row['id'];

// ── Inputs ────────────────────────────────────────────────────────
$note_text = isset($_POST['note_text']) ? trim($_POST['note_text']) : '';
$file_path = null;
$read_time = null;  // will be calculated below for text notes

// ── Handle PDF upload ─────────────────────────────────────────────
if (isset($_FILES['file'])) {
    $err = $_FILES['file']['error'];

    if ($err !== UPLOAD_ERR_OK) {
        $upload_errors = [
            UPLOAD_ERR_INI_SIZE   => 'File exceeds upload_max_filesize in php.ini',
            UPLOAD_ERR_FORM_SIZE  => 'File exceeds MAX_FILE_SIZE in form',
            UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder — check upload_tmp_dir in php.ini',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk — check permissions',
            UPLOAD_ERR_EXTENSION  => 'Upload blocked by a PHP extension',
        ];
        echo json_encode([
            'success' => false,
            'message' => $upload_errors[$err] ?? "Upload error code: $err"
        ]);
        exit;
    }

    // Detect MIME type — try finfo first (most reliable), then fall back
    $tmp      = $_FILES['file']['tmp_name'];
    $mimeType = '';

    if (function_exists('finfo_open')) {
        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $tmp);
        finfo_close($finfo);
    } elseif (function_exists('mime_content_type')) {
        $mimeType = mime_content_type($tmp);
    } else {
        // Last resort: trust the extension
        $ext      = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
        $mimeType = ($ext === 'pdf') ? 'application/pdf' : 'unknown';
    }

    if ($mimeType !== 'application/pdf') {
        echo json_encode(['success' => false, 'message' => "Only PDF files allowed (detected: $mimeType)"]);
        exit;
    }

    if ($_FILES['file']['size'] > 10 * 1024 * 1024) {
        echo json_encode(['success' => false, 'message' => 'File must be under 10 MB']);
        exit;
    }

    // Create uploads directory if it doesn't exist
    $upload_dir = __DIR__ . '/uploads/';
    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0755, true)) {
            echo json_encode(['success' => false, 'message' => 'Could not create uploads/ directory']);
            exit;
        }
    }

    if (!is_writable($upload_dir)) {
        echo json_encode(['success' => false, 'message' => 'uploads/ directory is not writable — check permissions']);
        exit;
    }

    $safe_name   = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($_FILES['file']['name']));
    $file_name   = time() . '_' . $safe_name;
    $target_file = $upload_dir . $file_name;

    if (!move_uploaded_file($tmp, $target_file)) {
        echo json_encode(['success' => false, 'message' => 'move_uploaded_file() failed — check temp dir and permissions']);
        exit;
    }

    $file_path = 'backend/uploads/' . $file_name;
}

// ── Guard ─────────────────────────────────────────────────────────
if (empty($note_text) && empty($file_path)) {
    echo json_encode(['success' => false, 'message' => 'Note cannot be empty']);
    exit;
}

// ── Calculate read_time for text notes (avg reading speed: 200 wpm) ──
if (!empty($note_text)) {
    $word_count = str_word_count($note_text);
    $read_time  = max(1, (int) ceil($word_count / 200));
}

// ── Insert ────────────────────────────────────────────────────────
$stmt = $conn->prepare("INSERT INTO notes (note_text, student_id, file_path, read_time) VALUES (?, ?, ?, ?)");
$stmt->bind_param("sisi", $note_text, $student_id, $file_path, $read_time);

if ($stmt->execute()) {
    $new_id = $conn->insert_id;
    $get    = $conn->prepare(
        "SELECT id, note_text, file_path, read_time, created_at, updated_at FROM notes WHERE id = ?"
    );
    $get->bind_param("i", $new_id);
    $get->execute();
    $note = $get->get_result()->fetch_assoc();
    echo json_encode(['success' => true, 'message' => 'Note saved!', 'note' => $note]);
} else {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $conn->error]);
}
?>