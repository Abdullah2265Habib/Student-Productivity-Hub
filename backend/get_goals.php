<?php
include 'db_config.php';
include 'check_auth.php';

$email = $_SESSION['email'];

// Get student_id
$stu = $conn->query("SELECT id FROM students WHERE email = '$email'");
$row = $stu->fetch_assoc();
$student_id = $row['id'];

// ── Get filter parameters (optional) ────────────────────────────
$status = isset($_GET['status']) ? $_GET['status'] : '';
$priority = isset($_GET['priority']) ? $_GET['priority'] : '';
$sort_by = isset($_GET['sort']) ? $_GET['sort'] : 'target_date';

// Validate sort_by to prevent SQL injection
$valid_sorts = ['target_date', 'priority', 'created_at', 'status'];
if (!in_array($sort_by, $valid_sorts)) {
    $sort_by = 'target_date';
}

// ── Build query with optional filters ──────────────────────────
$query = "SELECT id, goal_text, priority, target_date, status, created_at, updated_at 
          FROM goals WHERE student_id = ?";

$types = "i";
$params = [$student_id];

if (!empty($status)) {
    $query .= " AND status = ?";
    $types .= "s";
    $params[] = $status;
}

if (!empty($priority)) {
    $query .= " AND priority = ?";
    $types .= "s";
    $params[] = $priority;
}

$query .= " ORDER BY $sort_by DESC";

// ── Execute query ─────────────────────────────────────────────
$stmt = $conn->prepare($query);
call_user_func_array([$stmt, 'bind_param'], array_merge([$types], $params));
$stmt->execute();
$result = $stmt->get_result();

$goals = [];
while ($row = $result->fetch_assoc()) {
    $goals[] = $row;
}

echo json_encode(['success' => true, 'goals' => $goals]);
?>
