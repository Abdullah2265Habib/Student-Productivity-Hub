<?php
header('Content-Type: application/json');
session_start();
include 'db_config.php';

if (!isset($_SESSION['email'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$email = $_SESSION['email'];

$stu = $conn->prepare("SELECT id FROM students WHERE email = ? LIMIT 1");
$stu->bind_param("s", $email);
$stu->execute();
$student_id = $stu->get_result()->fetch_assoc()['id'] ?? null;

if (!$student_id) {
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    exit;
}

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
