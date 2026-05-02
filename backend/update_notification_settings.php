<?php
// ─────────────────────────────────────────────────────────────────────────────
// StudyHub — Update Notification Settings
// Saves notification preferences + optional SMTP credentials per student.
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

// SMTP credentials (optional — only update if provided)
$smtp_email    = isset($data['smtp_email']) ? trim($data['smtp_email']) : null;
$smtp_password = isset($data['smtp_password']) ? trim($data['smtp_password']) : null;

// Build the query dynamically
if ($smtp_email !== null && $smtp_password !== null && $smtp_password !== '') {
    // User provided new SMTP credentials
    $smtp_password_clean = str_replace(' ', '', $smtp_password);

    $stmt = $conn->prepare("
        INSERT INTO notification_settings
            (student_id, notifications_enabled, notify_days_before, notify_assignments, notify_goals, smtp_email, smtp_password)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            notifications_enabled = VALUES(notifications_enabled),
            notify_days_before    = VALUES(notify_days_before),
            notify_assignments    = VALUES(notify_assignments),
            notify_goals          = VALUES(notify_goals),
            smtp_email            = VALUES(smtp_email),
            smtp_password         = VALUES(smtp_password)
    ");
    $stmt->bind_param("iiiiiss", $student_id, $enabled, $days, $assignments, $goals, $smtp_email, $smtp_password_clean);
} elseif ($smtp_email !== null && ($smtp_password === null || $smtp_password === '')) {
    // User updated email but kept existing password
    $stmt = $conn->prepare("
        INSERT INTO notification_settings
            (student_id, notifications_enabled, notify_days_before, notify_assignments, notify_goals, smtp_email)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            notifications_enabled = VALUES(notifications_enabled),
            notify_days_before    = VALUES(notify_days_before),
            notify_assignments    = VALUES(notify_assignments),
            notify_goals          = VALUES(notify_goals),
            smtp_email            = VALUES(smtp_email)
    ");
    $stmt->bind_param("iiiiis", $student_id, $enabled, $days, $assignments, $goals, $smtp_email);
} else {
    // No SMTP changes — just preferences
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
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Notification settings saved!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
}

$conn->close();
