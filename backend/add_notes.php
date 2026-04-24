<?php
header('Content-Type: application/json');
session_start();
include 'db_config.php';

// Manual auth check — returns JSON instead of dying with plain text
if (!isset($_SESSION['email'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$email = $_SESSION['email'];

// Resolve student_id from students table
$stu = $conn->prepare("SELECT id FROM students WHERE email = ? LIMIT 1");
$stu->bind_param("s", $email);
$stu->execute();
$student_id = $stu->get_result()->fetch_assoc()['id'] ?? null;

if (!$student_id) {
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    exit;
}

$note_text = isset($_POST['note_text']) ? trim($_POST['note_text']) : '';
$file_path = null;

// ── Handle PDF upload ────────────────────────────────────────────
if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $upload_dir = __DIR__ . '/uploads/';

    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    $file_type = mime_content_type($_FILES['file']['tmp_name']);
    if ($file_type !== 'application/pdf') {
        echo json_encode(['success' => false, 'message' => 'Only PDF files are allowed']);
        exit;
    }

    $max_size = 10 * 1024 * 1024; // 10 MB
    if ($_FILES['file']['size'] > $max_size) {
        echo json_encode(['success' => false, 'message' => 'File size must be under 10 MB']);
        exit;
    }

    $file_name   = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($_FILES['file']['name']));
    $target_file = $upload_dir . $file_name;

    if (!move_uploaded_file($_FILES['file']['tmp_name'], $target_file)) {
        echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file']);
        exit;
    }

    // Web-accessible relative path (from project root)
    $file_path = 'backend/uploads/' . $file_name;
}

// ── Guard: nothing to save ────────────────────────────────────────
if (empty($note_text) && empty($file_path)) {
    echo json_encode(['success' => false, 'message' => 'Note cannot be empty']);
    exit;
}

// ── Insert into DB ────────────────────────────────────────────────
$stmt = $conn->prepare("INSERT INTO notes (note_text, student_id, file_path) VALUES (?, ?, ?)");
$stmt->bind_param("sis", $note_text, $student_id, $file_path);

if ($stmt->execute()) {
    $new_id = $conn->insert_id;
    $get    = $conn->prepare(
        "SELECT id, note_text, file_path, created_at, updated_at FROM notes WHERE id = ?"
    );
    $get->bind_param("i", $new_id);
    $get->execute();
    $note = $get->get_result()->fetch_assoc();
    echo json_encode(['success' => true, 'message' => 'Note saved!', 'note' => $note]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
}
?>