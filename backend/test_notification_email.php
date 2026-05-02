<?php
// ─────────────────────────────────────────────────────────────────────────────
// StudyHub — Send Test Notification Email
// Sends a test email to the logged-in student to verify SMTP configuration.
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

// Get student name
$stmt = $conn->prepare("SELECT name FROM students WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$name = $user['name'] ?? 'Student';

// Send test email
$mailer = new StudyHubMailer();

if (!$mailer->isConfigured()) {
    echo json_encode([
        'success' => false,
        'error'   => 'SMTP not configured. Please edit backend/email_config.php with your SMTP credentials and set "configured" to true.'
    ]);
    exit;
}

$html   = EmailTemplates::testEmail($name);
$result = $mailer->send($email, '✅ StudyHub — Test Notification', $html);

echo json_encode($result);

$conn->close();
