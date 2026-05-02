<?php
// ─────────────────────────────────────────────────────────────────────────────
// StudyHub — Update Notification Settings
// Saves the current student's notification preferences (upsert).
// ─────────────────────────────────────────────────────────────────────────────

session_start();
include 'db_config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['email'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$email = $_SESSION['email'];
$stu   = $conn->query("SELECT id FROM students WHERE email = '" . $conn->real_escape_string($email) . "'");
$row   = $stu->fetch_assoc();

if (!$row) {
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    exit;
}

$student_id = $row['id'];
$data = json_decode(file_get_contents('php://input'), true);

$enabled     = (int)($data['notifications_enabled'] ?? 1);
$days        = max(1, min(14, (int)($data['notify_days_before'] ?? 3)));
$assignments = (int)($data['notify_assignments'] ?? 1);
$goals       = (int)($data['notify_goals'] ?? 1);

$stmt = $conn->prepare("
    INSERT INTO notification_settings
        (student_id, notifications_enabled, notify_days_before, notify_assignments, notify_goals)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        notifications_enabled = VALUES(notifications_enabled),
        notify_days_before    = VALUES(notify_days_before),
        notify_assignments    = VALUES(notify_assignments),
        notify_goals          = VALUES(notify_goals)
");
$stmt->bind_param("iiiii", $student_id, $enabled, $days, $assignments, $goals);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Notification settings saved!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
}

$conn->close();
