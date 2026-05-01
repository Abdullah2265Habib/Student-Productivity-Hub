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

// Calculate read_time based on updated text (180 wpm)
$read_time = 0;
if (!empty($note_text)) {
    // Robust word count for special characters/UTF-8
    $word_count = count(preg_split('/\s+/u', $note_text, -1, PREG_SPLIT_NO_EMPTY));
    // Use 180 wpm for better granularity: ~1-180 words=1min, 181-360=2min, etc
    $read_time = max(1, ceil($word_count / 180));
}

// Update note with new text and recalculated read_time
$stmt = $conn->prepare("UPDATE notes SET note_text = ?, read_time = ? WHERE id = ? AND student_id = ?");
$stmt->bind_param("siii", $note_text, $read_time, $note_id, $student_id);
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Note updated', 'read_time' => $read_time]);
} else {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $conn->error]);
}
?>