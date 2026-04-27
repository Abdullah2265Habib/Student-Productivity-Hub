<?php
include 'db_config.php';
include 'check_auth.php';

$email = $_SESSION['email'];

$result = $conn->query("SELECT id FROM students WHERE email = '$email'");

$row = $result->fetch_assoc();
$student_id = $row['id'];

// ── Inputs ────────────────────────────────────────────────────────
$note_text = trim($_POST['note_text'] ?? '');
$file_path = null;
$read_time = 0;  // Initialize as integer

// ── Handle PDF upload ─────────────────────────────────────────────
if (isset($_FILES['file'])) {
    $err = $_FILES['file']['error'];

    // Check for upload errors
    if ($err !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'File upload error: ' . $err]);
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
    $safe_name   = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($_FILES['file']['name']));
    $file_name   = time() . '_' . $safe_name;
    $target_path = $upload_dir . $file_name;

    // Move the uploaded file to the target directory
    if (!move_uploaded_file($_FILES['file']['tmp_name'], $target_path)) {
        echo json_encode(['success' => false, 'message' => 'Failed to save PDF file']);
        exit;
    }

    $file_path = 'backend/uploads/' . $file_name;
}

// ── Calculate read_time (avg reading speed: 180 wpm for better granularity) ──
// For text notes: Calculate based on word count
// For PDF notes: Estimate as 15 minutes
if (!empty($file_path)) {
    // PDF note - set fixed read time
    $read_time = 15;
} else if (!empty($note_text)) {
    // Text-only note - calculate based on word count (180 wpm provides better granularity)
    $word_count = str_word_count($note_text);
    // Use 180 wpm for better granularity: ~1-180 words=1min, 181-360=2min, etc
    $read_time = max(1, ceil($word_count / 180));
} else {
    // Fallback - no text and no file (shouldn't happen with validation)
    $read_time = 0;
}

// ── Insert ────────────────────────────────────────────────────────
// not works for PDFs, need to use prepared statements
// $sql = "INSERT INTO notes (note_text, student_id, file_path, read_time) VALUES ('$note_text', '$student_id', '$file_path', '$read_time')";

// if ($conn->query($sql)) {
//     $new_id = $conn->insert_id;
//     $get    = "SELECT id, note_text, file_path, read_time, created_at, updated_at FROM notes WHERE id = '$new_id'";
//     $result = $conn->query($get);
//     $note = $result->fetch_assoc();
//     echo json_encode(['success' => true, 'message' => 'Note saved!', 'note' => $note]);
// } else {
//     echo json_encode(['success' => false, 'message' => 'DB error: ' . $conn->error]);
// }

$stmt = $conn->prepare("INSERT INTO notes (note_text, student_id, file_path, read_time) VALUES (?, ?, ?, ?)"); 
$stmt->bind_param("sisi", $note_text, $student_id, $file_path, $read_time); 
if ($stmt->execute()) { 
    $new_id = $conn->insert_id; 
    $get = $conn->prepare( "SELECT id, note_text, file_path, read_time, created_at, updated_at FROM notes WHERE id = ?" ); 
    $get->bind_param("i", $new_id); 
    $get->execute(); 
    $note = $get->get_result()->fetch_assoc();
    echo json_encode(['success' => true, 'message' => 'Note saved!', 'note' => $note]);
}
     
else { 
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $conn->error]); 
}
?>