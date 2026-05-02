<?php
// ─────────────────────────────────────────────────────────────────────────────
// StudyHub — Get Notification Settings
// Returns the current student's notification preferences + SMTP status.
// ─────────────────────────────────────────────────────────────────────────────

session_start();
include 'db_config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['email'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$email = $_SESSION['email'];
$stu   = $conn->query("SELECT id FROM students WHERE email = '" . $conn->real_escape_string($email) . "'");
$row   = $stu->fetch_assoc();

if (!$row) {
    echo json_encode(['success' => false, 'error' => 'Student not found']);
    exit;
}

$student_id = $row['id'];

// Try to get existing settings
$stmt = $conn->prepare("SELECT notifications_enabled, notify_days_before, notify_assignments, notify_goals FROM notification_settings WHERE student_id = ?");
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $settings = $result->fetch_assoc();
} else {
    // Auto-create default row
    $ins = $conn->prepare("INSERT INTO notification_settings (student_id) VALUES (?)");
    $ins->bind_param("i", $student_id);
    $ins->execute();

    $settings = [
        'notifications_enabled' => 1,
        'notify_days_before'    => 3,
        'notify_assignments'    => 1,
        'notify_goals'          => 1,
    ];
}

// Check SMTP config status
$config = require __DIR__ . '/email_config.php';
$smtp_configured = !empty($config['smtp_user']) && !empty($config['smtp_pass']) && !empty($config['configured']);

echo json_encode([
    'success'          => true,
    'settings'         => $settings,
    'smtp_configured'  => $smtp_configured,
]);

$conn->close();
