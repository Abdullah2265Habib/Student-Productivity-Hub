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
$stmt = $conn->prepare("SELECT notifications_enabled, notify_days_before, notify_assignments, notify_goals, smtp_email, smtp_password FROM notification_settings WHERE student_id = ?");
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
        'smtp_email'            => null,
        'smtp_password'         => null,
    ];
}

// Mask the password for the frontend (never send raw password back)
$smtp_configured = !empty($settings['smtp_email']) && !empty($settings['smtp_password']);
$masked_password = '';
if (!empty($settings['smtp_password'])) {
    $len = strlen($settings['smtp_password']);
    $masked_password = str_repeat('•', min($len, 16));
}

// Also check fallback config file
$config = require __DIR__ . '/email_config.php';
$fallback_configured = !empty($config['smtp_user']) && !empty($config['smtp_pass']) && !empty($config['configured']);

echo json_encode([
    'success'              => true,
    'settings'             => [
        'notifications_enabled' => $settings['notifications_enabled'],
        'notify_days_before'    => $settings['notify_days_before'],
        'notify_assignments'    => $settings['notify_assignments'],
        'notify_goals'          => $settings['notify_goals'],
        'smtp_email'            => $settings['smtp_email'] ?? '',
        'smtp_password_set'     => !empty($settings['smtp_password']),
        'smtp_password_masked'  => $masked_password,
    ],
    'smtp_configured'      => $smtp_configured || $fallback_configured,
    'smtp_source'          => $smtp_configured ? 'personal' : ($fallback_configured ? 'system' : 'none'),
]);

$conn->close();
