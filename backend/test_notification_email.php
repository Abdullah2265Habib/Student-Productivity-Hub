<?php
// ─────────────────────────────────────────────────────────────────────────────
// StudyHub — Send Test Notification Email
// Uses the student's own SMTP credentials (from DB) or falls back to config.
// ─────────────────────────────────────────────────────────────────────────────

session_start();
include 'db_config.php';
require_once 'smtp_mailer.php';
require_once 'email_templates.php';

header('Content-Type: application/json');

if (!isset($_SESSION['email'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$email = $_SESSION['email'];

// Get student info + SMTP credentials
$stmt = $conn->prepare("
    SELECT s.name, s.email, ns.smtp_email, ns.smtp_password
    FROM students s
    LEFT JOIN notification_settings ns ON ns.student_id = s.id
    WHERE s.email = ?
");
$stmt->bind_param("s", $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

$name       = $user['name'] ?? 'Student';
$smtpEmail  = $user['smtp_email'] ?? null;
$smtpPass   = $user['smtp_password'] ?? null;

// Create mailer with per-student credentials (falls back to config file)
$mailer = new StudyHubMailer($smtpEmail, $smtpPass);

if (!$mailer->isConfigured()) {
    echo json_encode([
        'success' => false,
        'error'   => 'SMTP not configured. Enter your Gmail address and App Password in Settings → Notifications, then save.'
    ]);
    exit;
}

// Send test email TO the student's profile email (not the SMTP email)
$html   = EmailTemplates::testEmail($name);
$result = $mailer->send($email, '✅ StudyHub — Test Notification', $html);

echo json_encode($result);

$conn->close();
