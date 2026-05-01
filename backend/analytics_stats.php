<?php
require_once 'db_config.php';
require_once 'check_auth.php';

header('Content-Type: application/json');

$email = $_SESSION['email'];

// Get student_id
$stu = $conn->query("SELECT id FROM students WHERE email = '$email'");
$row = $stu->fetch_assoc();
$student_id = (int)$row['id'];

// ── Notes Stats ──────────────────────────────────────────────────────────
$totalNotesRes = $conn->query("SELECT COUNT(*) as total FROM notes WHERE student_id = $student_id");
$totalNotes = (int)$totalNotesRes->fetch_assoc()['total'];

$textNotesRes = $conn->query("SELECT COUNT(*) as total FROM notes WHERE student_id = $student_id AND (file_path IS NULL OR file_path = '')");
$textNotes = (int)$textNotesRes->fetch_assoc()['total'];

$pdfNotesRes = $conn->query("SELECT COUNT(*) as total FROM notes WHERE student_id = $student_id AND file_path IS NOT NULL AND file_path != ''");
$pdfNotes = (int)$pdfNotesRes->fetch_assoc()['total'];

// Notes per month (last 6 months)
$notesPerMonth = [];
$npRes = $conn->query(
    "SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
     FROM notes WHERE student_id = $student_id
     AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY month ORDER BY month ASC"
);
while ($r = $npRes->fetch_assoc()) {
    $notesPerMonth[] = $r;
}

// ── Assignments Stats ────────────────────────────────────────────────────
$totalAssignRes = $conn->query("SELECT COUNT(*) as total FROM assignments WHERE student_id = $student_id");
$totalAssignments = (int)$totalAssignRes->fetch_assoc()['total'];

// Assignments by status
$assignByStatus = [];
$absRes = $conn->query(
    "SELECT status, COUNT(*) as count FROM assignments
     WHERE student_id = $student_id GROUP BY status"
);
while ($r = $absRes->fetch_assoc()) {
    $assignByStatus[$r['status']] = (int)$r['count'];
}

// Assignments completed per month (last 6 months)
$assignPerMonth = [];
$apmRes = $conn->query(
    "SELECT DATE_FORMAT(due_date, '%Y-%m') AS month, COUNT(*) AS count
     FROM assignments WHERE student_id = $student_id
     AND due_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
     GROUP BY month ORDER BY month ASC"
);
while ($r = $apmRes->fetch_assoc()) {
    $assignPerMonth[] = $r;
}

// ── Goals Stats ──────────────────────────────────────────────────────────
$totalGoalsRes = $conn->query("SELECT COUNT(*) as total FROM goals WHERE student_id = $student_id");
$totalGoals = (int)$totalGoalsRes->fetch_assoc()['total'];

// Goals by status
$goalsByStatus = [];
$gbsRes = $conn->query(
    "SELECT status, COUNT(*) as count FROM goals
     WHERE student_id = $student_id GROUP BY status"
);
while ($r = $gbsRes->fetch_assoc()) {
    $goalsByStatus[$r['status']] = (int)$r['count'];
}

// Goals by priority
$goalsByPriority = [];
$gbpRes = $conn->query(
    "SELECT priority, COUNT(*) as count FROM goals
     WHERE student_id = $student_id GROUP BY priority"
);
while ($r = $gbpRes->fetch_assoc()) {
    $goalsByPriority[$r['priority']] = (int)$r['count'];
}

// ── Study Sessions Stats ─────────────────────────────────────────────────
$totalStudyRes = $conn->query(
    "SELECT COALESCE(SUM(session_duration), 0) AS total_seconds,
            COUNT(*) AS session_count
     FROM timers WHERE student_id = $student_id"
);
$studyRow = $totalStudyRes->fetch_assoc();
$totalStudySeconds = (int)$studyRow['total_seconds'];
$totalSessions = (int)$studyRow['session_count'];

// Today's study time
$todayRes = $conn->query(
    "SELECT COALESCE(SUM(session_duration), 0) AS today_seconds
     FROM timers WHERE student_id = $student_id AND DATE(date_logged) = CURDATE()"
);
$todaySeconds = (int)$todayRes->fetch_assoc()['today_seconds'];

// Study time per day (last 7 days)
$studyPerDay = [];
$spdRes = $conn->query(
    "SELECT DATE(date_logged) AS day, SUM(session_duration) AS seconds, COUNT(*) AS sessions
     FROM timers WHERE student_id = $student_id
     AND date_logged >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
     GROUP BY day ORDER BY day ASC"
);
while ($r = $spdRes->fetch_assoc()) {
    $studyPerDay[] = $r;
}

// Study time per week (last 4 weeks)
$studyPerWeek = [];
$spwRes = $conn->query(
    "SELECT YEARWEEK(date_logged, 1) AS week_num,
            MIN(DATE(date_logged)) AS week_start,
            SUM(session_duration) AS seconds,
            COUNT(*) AS sessions
     FROM timers WHERE student_id = $student_id
     AND date_logged >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
     GROUP BY week_num ORDER BY week_num ASC"
);
while ($r = $spwRes->fetch_assoc()) {
    $studyPerWeek[] = $r;
}

// Average session length
$avgSession = $totalSessions > 0 ? round($totalStudySeconds / $totalSessions) : 0;

// ── Streak calculation (consecutive days with activity) ──────────────────
$streakRes = $conn->query(
    "SELECT DISTINCT DATE(date_logged) AS day FROM timers
     WHERE student_id = $student_id ORDER BY day DESC"
);
$streak = 0;
$checkDate = new DateTime();
while ($r = $streakRes->fetch_assoc()) {
    $dayDate = new DateTime($r['day']);
    if ($dayDate->format('Y-m-d') === $checkDate->format('Y-m-d')) {
        $streak++;
        $checkDate->modify('-1 day');
    } else {
        break;
    }
}

// ── Productivity Score (simple heuristic) ────────────────────────────────
$completedGoals = $goalsByStatus['completed'] ?? 0;
$submittedAssign = $assignByStatus['submitted'] ?? 0;
$goalScore = $totalGoals > 0 ? ($completedGoals / $totalGoals) * 40 : 20;
$assignScore = $totalAssignments > 0 ? ($submittedAssign / $totalAssignments) * 30 : 15;
$studyScore = min(30, ($totalStudySeconds / 3600) * 3); // 10hrs = full 30pts
$productivityScore = round($goalScore + $assignScore + $studyScore);

echo json_encode([
    'success' => true,
    'notes' => [
        'total'     => $totalNotes,
        'text'      => $textNotes,
        'pdf'       => $pdfNotes,
        'per_month' => $notesPerMonth,
    ],
    'assignments' => [
        'total'      => $totalAssignments,
        'by_status'  => $assignByStatus,
        'per_month'  => $assignPerMonth,
    ],
    'goals' => [
        'total'       => $totalGoals,
        'by_status'   => $goalsByStatus,
        'by_priority' => $goalsByPriority,
    ],
    'study' => [
        'total_seconds'  => $totalStudySeconds,
        'today_seconds'  => $todaySeconds,
        'total_sessions' => $totalSessions,
        'avg_session'    => $avgSession,
        'per_day'        => $studyPerDay,
        'per_week'       => $studyPerWeek,
        'streak'         => $streak,
    ],
    'productivity_score' => $productivityScore,
]);
?>
