<?php
include 'db_config.php';
include 'check_auth.php';

$current_email = $_SESSION['email'];

$note_id = $_POST['note_id'] ?? '';
$target_email = $_POST['target_email'] ?? '';

if (empty($note_id) || empty($target_email)) {
    echo json_encode(['success' => false, 'message' => 'Missing note ID or target email.']);
    exit;
}

if ($current_email === $target_email) {
    echo json_encode(['success' => false, 'message' => 'You cannot share a note with yourself.']);
    exit;
}

// Get current student ID
$stmt = $conn->prepare("SELECT id FROM students WHERE email = ?");
$stmt->bind_param("s", $current_email);
$stmt->execute();
$res = $stmt->get_result();
$current_student = $res->fetch_assoc();

if (!$current_student) {
    echo json_encode(['success' => false, 'message' => 'Current user not found.']);
    exit;
}
$current_student_id = $current_student['id'];

// Get target student ID
$stmt = $conn->prepare("SELECT id FROM students WHERE email = ?");
$stmt->bind_param("s", $target_email);
$stmt->execute();
$res = $stmt->get_result();
$target_student = $res->fetch_assoc();

if (!$target_student) {
    echo json_encode(['success' => false, 'message' => 'Target student not found with that email address.']);
    exit;
}
$target_student_id = $target_student['id'];

// Get the note to share
$stmt = $conn->prepare("SELECT note_text, file_path, read_time FROM notes WHERE id = ? AND student_id = ?");
$stmt->bind_param("ii", $note_id, $current_student_id);
$stmt->execute();
$res = $stmt->get_result();
$note = $res->fetch_assoc();

if (!$note) {
    echo json_encode(['success' => false, 'message' => 'Note not found or you do not have permission to share it.']);
    exit;
}

// Copy the note to the target user
$note_text = $note['note_text'];
$file_path = $note['file_path'];
$read_time = $note['read_time'];

$stmt = $conn->prepare("INSERT INTO notes (note_text, student_id, file_path, read_time) VALUES (?, ?, ?, ?)");
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
    exit;
}

$stmt->bind_param("sisi", $note_text, $target_student_id, $file_path, $read_time);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Note shared successfully!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $stmt->error]);
}
?>
