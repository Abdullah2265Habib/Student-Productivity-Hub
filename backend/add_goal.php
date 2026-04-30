<?php
include 'db_config.php';
include 'check_auth.php';

$email = $_SESSION['email'];

$result = $conn->query("SELECT id FROM students WHERE email = '$email'");
$row = $result->fetch_assoc();
$student_id = $row['id'];

// ── Inputs ────────────────────────────────────────────────────────
$goal_text = trim($_POST['goal_text'] ?? '');
$priority = $_POST['priority'] ?? 'medium';
$target_date = $_POST['target_date'] ?? '';

// ── Validation ────────────────────────────────────────────────────
if (empty($goal_text)) {
    echo json_encode(['success' => false, 'message' => 'Goal text is required']);
    exit;
}

if (empty($target_date)) {
    echo json_encode(['success' => false, 'message' => 'Target date is required']);
    exit;
}

// Validate priority
if (!in_array($priority, ['low', 'medium', 'high'])) {
    $priority = 'medium';
}

// Validate date format
if (!strtotime($target_date)) {
    echo json_encode(['success' => false, 'message' => 'Invalid date format']);
    exit;
}

// ── Insert Goal ───────────────────────────────────────────────────
$stmt = $conn->prepare("INSERT INTO goals (student_id, goal_text, priority, target_date, status) VALUES (?, ?, ?, ?, 'pending')");
$stmt->bind_param("isss", $student_id, $goal_text, $priority, $target_date);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Goal added successfully', 'goal_id' => $stmt->insert_id]);
} else {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $conn->error]);
}
?>
