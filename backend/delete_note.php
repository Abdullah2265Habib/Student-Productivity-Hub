<?php
include 'db_config.php';
include 'check_auth.php';

$email   = $_SESSION['email'];
$note_id = isset($_POST['note_id']) ? (int)$_POST['note_id'] : 0;

if ($note_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid note ID']);
    exit;
}

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

// Fetch file_path before deleting so we can remove the physical file
$stmt = $conn->prepare("SELECT file_path FROM notes WHERE id = ? AND student_id = ?");
$stmt->bind_param("ii", $note_id, $student_id);
$stmt->execute();
$noteRow = $stmt->get_result()->fetch_assoc();

if (!$noteRow) {
    echo json_encode(['success' => false, 'message' => 'Note not found']);
    exit;
}

// Remove the physical PDF file if it exists
if (!empty($noteRow['file_path'])) {
    $physicalPath = __DIR__ . '/uploads/' . basename($noteRow['file_path']);
    if (file_exists($physicalPath)) {
        unlink($physicalPath);
    }
}

// Delete the note
$del = $conn->prepare("DELETE FROM notes WHERE id = ? AND student_id = ?");
$del->bind_param("ii", $note_id, $student_id);
if ($del->execute()) {
    echo json_encode(['success' => true, 'message' => 'Note deleted']);
} else {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $conn->error]);
}
?>
