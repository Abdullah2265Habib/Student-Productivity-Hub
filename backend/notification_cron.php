<?php
// ─────────────────────────────────────────────────────────────────────────────
// StudyHub — Notification Cron / Check-and-Send Script
//
// Checks ALL students for upcoming deadlines and sends emails.
// Uses each student's own SMTP credentials (from DB) with fallback to config.
//
// Task Scheduler:  php "D:\...\backend\notification_cron.php"
// Browser:         http://yoursite.com/backend/notification_cron.php?key=studyhub_notify_2026
// ─────────────────────────────────────────────────────────────────────────────

// Optional: simple key to prevent unauthorised web hits
$CRON_KEY = 'studyhub_notify_2026';

// If called from browser, verify key
if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json');
    if (($_GET['key'] ?? '') !== $CRON_KEY) {
        echo json_encode(['success' => false, 'error' => 'Invalid cron key']);
        exit;
    }
}

include __DIR__ . '/db_config.php';
require_once __DIR__ . '/smtp_mailer.php';
require_once __DIR__ . '/email_templates.php';

$today  = new DateTime();
$sent   = 0;
$errors = [];

// ── Get all students with notifications enabled ──────────────────────────
$sql = "
    SELECT s.id, s.name, s.email,
           ns.notify_days_before, ns.notify_assignments, ns.notify_goals,
           ns.smtp_email, ns.smtp_password
    FROM students s
    JOIN notification_settings ns ON ns.student_id = s.id
    WHERE ns.notifications_enabled = 1
";
$students = $conn->query($sql);

while ($stu = $students->fetch_assoc()) {

    $sid  = $stu['id'];
    $days = (int)$stu['notify_days_before'];
    $upcoming_assignments = [];
    $upcoming_goals       = [];

    // ── Assignments ──────────────────────────────────────────────────
    if ($stu['notify_assignments']) {
        $q = $conn->prepare("
            SELECT course_name, due_date, status
            FROM assignments
            WHERE student_id = ?
              AND status != 'submitted'
              AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
            ORDER BY due_date ASC
        ");
        $q->bind_param("ii", $sid, $days);
        $q->execute();
        $res = $q->get_result();
        while ($a = $res->fetch_assoc()) {
            $due = new DateTime($a['due_date']);
            $a['days_left'] = max(0, (int)$today->diff($due)->days);
            $upcoming_assignments[] = $a;
        }
    }

    // ── Goals ────────────────────────────────────────────────────────
    if ($stu['notify_goals']) {
        $q = $conn->prepare("
            SELECT goal_text, target_date, status
            FROM goals
            WHERE student_id = ?
              AND status != 'completed'
              AND target_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
            ORDER BY target_date ASC
        ");
        $q->bind_param("ii", $sid, $days);
        $q->execute();
        $res = $q->get_result();
        while ($g = $res->fetch_assoc()) {
            $td = new DateTime($g['target_date']);
            $g['days_left'] = max(0, (int)$today->diff($td)->days);
            $upcoming_goals[] = $g;
        }
    }

    // ── Skip if nothing to notify ────────────────────────────────────
    $total = count($upcoming_assignments) + count($upcoming_goals);
    if ($total === 0) continue;

    // ── Check: already notified today? ───────────────────────────────
    $dup = $conn->prepare("
        SELECT id FROM notification_log
        WHERE student_id = ? AND DATE(sent_at) = CURDATE()
    ");
    $dup->bind_param("i", $sid);
    $dup->execute();
    if ($dup->get_result()->num_rows > 0) continue;   // already sent today

    // ── Create mailer with per-student SMTP credentials ──────────────
    $mailer = new StudyHubMailer($stu['smtp_email'], $stu['smtp_password']);

    if (!$mailer->isConfigured()) {
        $errors[] = "Skipped {$stu['email']}: No SMTP credentials configured.";
        continue;
    }

    // ── Send email ───────────────────────────────────────────────────
    $html   = EmailTemplates::deadlineReminder($stu['name'], $upcoming_assignments, $upcoming_goals);
    $result = $mailer->send($stu['email'], "⏰ StudyHub — {$total} Deadline(s) Approaching!", $html);

    if ($result['success']) {
        // Log it
        $log = $conn->prepare("INSERT INTO notification_log (student_id, items_count) VALUES (?, ?)");
        $log->bind_param("ii", $sid, $total);
        $log->execute();
        $sent++;
    } else {
        $errors[] = "Failed for {$stu['email']}: " . ($result['error'] ?? 'Unknown error');
    }
}

$output = [
    'success'       => true,
    'emails_sent'   => $sent,
    'errors'        => $errors,
    'checked_at'    => $today->format('Y-m-d H:i:s'),
];

if (php_sapi_name() === 'cli') {
    echo "Notification check complete. Sent: {$sent}\n";
    if ($errors) echo "Errors:\n" . implode("\n", $errors) . "\n";
} else {
    echo json_encode($output);
}

$conn->close();
