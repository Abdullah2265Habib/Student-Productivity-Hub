<?php
include 'db_config.php';
include 'check_auth.php';

$email = $_SESSION['email'];
$goal_id = isset($_POST['goal_id']) ? (int)$_POST['goal_id'] : 0;

// Get student_id
$result = $conn->query("SELECT id FROM students WHERE email = '$email'");
$row = $result->fetch_assoc();
$student_id = $row['id'];

// ── Validation ────────────────────────────────────────────────────
if (empty($goal_id)) {
    echo json_encode(['success' => false, 'message' => 'Goal ID is required']);
    exit;
}

// ── Delete Goal ───────────────────────────────────────────────────
$stmt = $conn->prepare("DELETE FROM goals WHERE id = ? AND student_id = ?");
$stmt->bind_param("ii", $goal_id, $student_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Goal deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Goal not found']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $conn->error]);
}
?>
