<?php
include 'db_config.php';
include 'check_auth.php';

header('Content-Type: application/json');

$email = $_SESSION['email'];

// Get student_id
$stu = $conn->prepare("SELECT id FROM students WHERE email = ?");
$stu->bind_param("s", $email);
$stu->execute();
$row = $stu->get_result()->fetch_assoc();
$student_id = $row['id'] ?? null;

if (!$student_id) {
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    exit;
}

$holiday_id = isset($_POST['id']) ? (int)$_POST['id'] : 0;

if (!$holiday_id) {
    echo json_encode(['success' => false, 'message' => 'Holiday ID is required']);
    exit;
}

// Delete only if it belongs to this student
$stmt = $conn->prepare("DELETE FROM holidays WHERE id = ? AND student_id = ?");
$stmt->bind_param("ii", $holiday_id, $student_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Holiday deleted']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Holiday not found']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $conn->error]);
}
?>