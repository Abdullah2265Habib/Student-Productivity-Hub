<?php
include 'db_config.php';
include 'check_auth.php';

$email   = $_SESSION['email'];
$note_id = $_POST['note_id'];

$result = $conn->query("SELECT id FROM students WHERE email = '$email'");
$row = $result->fetch_assoc();
$student_id = $row['id'];

// Fetch file_path before deleting so we can remove the physical file
$stmt = $conn->prepare("SELECT file_path FROM notes WHERE id = '$note_id' AND student_id = '$student_id'");

$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();


// Remove the physical PDF file if it exists
if (!empty($row['file_path'])) {
    $physicalPath = __DIR__ . '/uploads/' . basename($row['file_path']);
    if (file_exists($physicalPath)) {
        unlink($physicalPath);
    }
}

$del = $conn->prepare("DELETE FROM notes WHERE id = '$note_id' AND student_id = '$student_id'");
$del->execute();

echo json_encode(['success' => true, 'message' => 'Note deleted']);
?>
