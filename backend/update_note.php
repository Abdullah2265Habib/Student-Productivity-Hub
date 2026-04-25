<?php
include 'db_config.php';
include 'check_auth.php';

$email = $_SESSION['email'];
$note_id = isset($_POST['note_id']) ? (int)$_POST['note_id'] : 0;
$note_text = isset($_POST['note_text']) ? $_POST['note_text'] : '';

// Get student_id
$result = $conn->prepare("SELECT id FROM students WHERE email = ?");
$result->bind_param("s", $email);
$result->execute();
$row = $result->get_result()->fetch_assoc();
$student_id = $row['id'] ?? null;

if (!$student_id) {
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    exit;
}

// Update note
$del = $conn->prepare("UPDATE notes SET note_text = ? WHERE id = ? AND student_id = ?");
$del->bind_param("sii", $note_text, $note_id, $student_id);
$del->execute();

echo json_encode(['success' => true, 'message' => 'Note updated']);
?>