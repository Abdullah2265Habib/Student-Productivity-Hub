<?php
require_once 'db_config.php';
require_once 'check_auth.php';

header('Content-Type: application/json');

$email = $_SESSION['email'];

// Get student_id
$stu = $conn->query("SELECT id FROM students WHERE email = '$email'");
$row = $stu->fetch_assoc();
$student_id = (int)$row['id'];

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

// ── GET: fetch total study time + recent sessions ──────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    if ($action === 'stats') {
        // Total cumulative study time in seconds
        $totalRes = $conn->query(
            "SELECT COALESCE(SUM(session_duration), 0) AS total_seconds
             FROM timers
             WHERE student_id = $student_id"
        );
        $totalRow = $totalRes->fetch_assoc();
        $totalSeconds = (int)$totalRow['total_seconds'];

        // Today's study time
        $todayRes = $conn->query(
            "SELECT COALESCE(SUM(session_duration), 0) AS today_seconds
             FROM timers
             WHERE student_id = $student_id
               AND DATE(date_logged) = CURDATE()"
        );
        $todayRow = $todayRes->fetch_assoc();
        $todaySeconds = (int)$todayRow['today_seconds'];

        // Session count total
        $countRes = $conn->query(
            "SELECT COUNT(*) AS session_count FROM timers WHERE student_id = $student_id"
        );
        $countRow = $countRes->fetch_assoc();
        $sessionCount = (int)$countRow['session_count'];

        // Recent 5 sessions
        $recentRes = $conn->query(
            "SELECT id, session_duration, session_start_time, session_end_time, date_logged
             FROM timers
             WHERE student_id = $student_id
             ORDER BY date_logged DESC
             LIMIT 5"
        );
        $recentSessions = [];
        while ($r = $recentRes->fetch_assoc()) {
            $recentSessions[] = $r;
        }

        echo json_encode([
            'success'          => true,
            'total_seconds'    => $totalSeconds,
            'today_seconds'    => $todaySeconds,
            'session_count'    => $sessionCount,
            'recent_sessions'  => $recentSessions,
        ]);
        exit();
    }

    echo json_encode(['success' => false, 'message' => 'Unknown action']);
    exit();
}

// ── POST: save a completed session ────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'save' || (isset($data['action']) && $data['action'] === 'save')) {

        $session_duration   = (int)($data['session_duration'] ?? 0);
        $session_start_time = $conn->real_escape_string($data['session_start_time'] ?? date('Y-m-d H:i:s'));
        $session_end_time   = $conn->real_escape_string($data['session_end_time']   ?? date('Y-m-d H:i:s'));

        if ($session_duration <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid session duration']);
            exit();
        }

        // Compute cumulative total_study_time for this student
        $prevRes  = $conn->query(
            "SELECT COALESCE(SUM(session_duration), 0) AS prev_total
             FROM timers WHERE student_id = $student_id"
        );
        $prevRow  = $prevRes->fetch_assoc();
        $newTotal = (int)$prevRow['prev_total'] + $session_duration;

        $stmt = $conn->prepare(
            "INSERT INTO timers
                (student_id, session_duration, session_start_time, session_end_time, total_study_time)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->bind_param('iissi',
            $student_id,
            $session_duration,
            $session_start_time,
            $session_end_time,
            $newTotal
        );

        if ($stmt->execute()) {
            echo json_encode([
                'success'          => true,
                'message'          => 'Session saved',
                'session_id'       => $conn->insert_id,
                'total_study_time' => $newTotal,
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'DB error: ' . $conn->error]);
        }
        exit();
    }

    echo json_encode(['success' => false, 'message' => 'Unknown action']);
    exit();
}

echo json_encode(['success' => false, 'message' => 'Invalid request method']);