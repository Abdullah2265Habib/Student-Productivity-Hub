<?php
include 'db_config.php';
include 'check_auth.php';

$email = $_SESSION['email'];

$stu = $conn->query("SELECT id FROM students WHERE email = '$email'");

$row = $stu->fetch_assoc();
$student_id = $row['id'];

$stmt = $conn->prepare(
    "SELECT id, note_text, file_path, read_time, created_at, updated_at
     FROM notes
     WHERE student_id = ?
     ORDER BY updated_at DESC"
);
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

$notes = [];
while ($row = $result->fetch_assoc()) {
    $notes[] = $row;
}

echo json_encode(['success' => true, 'notes' => $notes]);
?>
