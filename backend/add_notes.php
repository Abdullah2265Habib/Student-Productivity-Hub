<?php
include 'db_config.php';
include 'check_auth.php';

$email = $_SESSION['email'];

$result = $conn->query("SELECT id FROM students WHERE email = '$email'");

$row = $result->fetch_assoc();
$student_id = $row['id'];

// ── Inputs ────────────────────────────────────────────────────────
$note_text = $_POST['note_text'];
$file_path = null;
$read_time = null; 

// ── Handle PDF upload ─────────────────────────────────────────────
if (isset($_FILES['file'])) {
    $err = $_FILES['file']['error'];

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

    $file_path = 'backend/uploads/' . $file_name;
}

// ── Calculate read_time for text notes (avg reading speed: 200 wpm) ──
if (!empty($note_text)) {
    $word_count = str_word_count($note_text);
    $read_time  = max(1, (int) ceil($word_count / 200));
}
if (!empty($file_path)) {
    $read_time = 15;
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