<?php
include 'db_config.php';
include 'check_auth.php';

$email = $_SESSION['email'];
$goal_id = isset($_POST['goal_id']) ? (int)$_POST['goal_id'] : 0;
$goal_text = isset($_POST['goal_text']) ? trim($_POST['goal_text']) : '';
$priority = isset($_POST['priority']) ? $_POST['priority'] : '';
$target_date = isset($_POST['target_date']) ? $_POST['target_date'] : '';
$status = isset($_POST['status']) ? $_POST['status'] : '';

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

// ── Validation ────────────────────────────────────────────────────
if (empty($goal_id)) {
    echo json_encode(['success' => false, 'message' => 'Goal ID is required']);
    exit;
}

// Validate priority if provided
if (!empty($priority) && !in_array($priority, ['low', 'medium', 'high'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid priority value']);
    exit;
}

// Validate status if provided
if (!empty($status) && !in_array($status, ['pending', 'in_progress', 'completed'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid status value']);
    exit;
}

// Validate date format if provided
if (!empty($target_date) && !strtotime($target_date)) {
    echo json_encode(['success' => false, 'message' => 'Invalid date format']);
    exit;
}

// ── Build dynamic UPDATE query ────────────────────────────────────
$updates = [];
$types = '';
$params = [];

if (!empty($goal_text)) {
    $updates[] = 'goal_text = ?';
    $types .= 's';
    $params[] = $goal_text;
}

if (!empty($priority)) {
    $updates[] = 'priority = ?';
    $types .= 's';
    $params[] = $priority;
}

if (!empty($target_date)) {
    $updates[] = 'target_date = ?';
    $types .= 's';
    $params[] = $target_date;
}

if (!empty($status)) {
    $updates[] = 'status = ?';
    $types .= 's';
    $params[] = $status;
}

// Always update the updated_at timestamp
$updates[] = 'updated_at = CURRENT_TIMESTAMP';

if (empty($updates)) {
    echo json_encode(['success' => false, 'message' => 'No fields to update']);
    exit;
}

$query = "UPDATE goals SET " . implode(', ', $updates) . " WHERE id = ? AND student_id = ?";
$types .= 'ii';
$params[] = $goal_id;
$params[] = $student_id;

$stmt = $conn->prepare($query);
call_user_func_array([$stmt, 'bind_param'], array_merge([$types], $params));

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Goal updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Goal not found or no changes made']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $conn->error]);
}
?>
