<?php
header('Content-Type: application/json');
session_start();
include 'db_config.php';

if (!isset($_SESSION['email'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$email   = $_SESSION['email'];
$note_id = isset($_POST['note_id']) ? (int)$_POST['note_id'] : 0;



// Resolve student_id
$stu = $conn->prepare("SELECT id FROM students WHERE email = ? LIMIT 1");
$stu->bind_param("s", $email);
$stu->execute();
$student_id = $stu->get_result()->fetch_assoc()['id'] ?? null;

if (!$student_id) {
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    exit;
}

// Fetch file_path before deleting so we can remove the physical file
$stmt = $conn->prepare("SELECT file_path FROM notes WHERE id = ? AND student_id = ?");
$stmt->bind_param("ii", $note_id, $student_id);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();

if (!$row) {
    echo json_encode(['success' => false, 'message' => 'Note not found']);
    exit;
}

// Remove the physical PDF file if it exists
if (!empty($row['file_path'])) {
    $physicalPath = __DIR__ . '/uploads/' . basename($row['file_path']);
    if (file_exists($physicalPath)) {
        unlink($physicalPath);
    }
}

$del = $conn->prepare("DELETE FROM notes WHERE id = ? AND student_id = ?");
$del->bind_param("ii", $note_id, $student_id);
$del->execute();

echo json_encode(['success' => true, 'message' => 'Note deleted']);
?>
