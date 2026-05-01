<?php
include 'db_config.php';
include 'check_auth.php';

$email = $_SESSION['email'];

$stmt = $conn->prepare("SELECT id FROM students WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}
$student_id = $row['id'];

// ── Inputs ────────────────────────────────────────────────────────
$note_text = trim($_POST['note_text'] ?? '');
$file_path = null;
$read_time = 0;

// ── Handle PDF upload ─────────────────────────────────────────────
if (isset($_FILES['file'])) {
    $err = $_FILES['file']['error'];
    if ($err !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'File upload error: ' . $err]);
        exit;
    }

    $upload_dir = __DIR__ . '/uploads/';
    if (!is_dir($upload_dir)) {
        if (!mkdir($upload_dir, 0755, true)) {
            echo json_encode(['success' => false, 'message' => 'Could not create uploads/ directory']);
            exit;
        }
    }
    $safe_name   = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($_FILES['file']['name']));
    $file_name   = time() . '_' . $safe_name;
    $target_path = $upload_dir . $file_name;

    if (!move_uploaded_file($_FILES['file']['tmp_name'], $target_path)) {
        echo json_encode(['success' => false, 'message' => 'Failed to save PDF file']);
        exit;
    }
    $file_path = 'backend/uploads/' . $file_name;
}

// ── Calculate read_time (avg reading speed: 180 wpm) ────────────────
if (!empty($file_path)) {
    $read_time = 15;
} else if (!empty($note_text)) {
    // Robust word count for special characters/UTF-8
    $word_count = count(preg_split('/\s+/u', $note_text, -1, PREG_SPLIT_NO_EMPTY));
    $read_time = max(1, ceil($word_count / 180));
} else {
    $read_time = 0;
}

// ── Insert ────────────────────────────────────────────────────────
$stmt = $conn->prepare("INSERT INTO notes (note_text, student_id, file_path, read_time) VALUES (?, ?, ?, ?)"); 
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    exit;
}

$stmt->bind_param("sisi", $note_text, $student_id, $file_path, $read_time); 

if ($stmt->execute()) { 
    $new_id = $conn->insert_id; 
    
    $get = $conn->prepare("SELECT id, note_text, file_path, read_time, created_at, updated_at FROM notes WHERE id = ?"); 
    if ($get) {
        $get->bind_param("i", $new_id); 
        $get->execute(); 
        $result = $get->get_result();
        if ($result) {
            $note = $result->fetch_assoc();
            echo json_encode(['success' => true, 'message' => 'Note saved!', 'note' => $note]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Could not retrieve saved note']);
        }
    } else {
        echo json_encode(['success' => true, 'message' => 'Note saved, but could not retrieve data immediately.']);
    }
} else { 
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $stmt->error]); 
}
?>