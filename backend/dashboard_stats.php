<?php
include 'db_config.php';
include 'check_auth.php';

$email = $_SESSION['email'];

// Get student_id
$stu = $conn->query("SELECT id FROM students WHERE email = '$email'");
$row = $stu->fetch_assoc();
$student_id = $row['id'];

// Total notes count
$countResult = $conn->query("SELECT COUNT(*) as total FROM notes WHERE student_id = '$student_id'");
$totalNotes = (int)$countResult->fetch_assoc()['total'];

// Text notes count
$textResult = $conn->query("SELECT COUNT(*) as total FROM notes WHERE student_id = '$student_id' AND (file_path IS NULL OR file_path = '')");
$textNotes = (int)$textResult->fetch_assoc()['total'];

// PDF notes count
$pdfResult = $conn->query("SELECT COUNT(*) as total FROM notes WHERE student_id = '$student_id' AND file_path IS NOT NULL AND file_path != ''");
$pdfNotes = (int)$pdfResult->fetch_assoc()['total'];

// Recent 5 notes
$recentResult = $conn->query("SELECT id, note_text, file_path, read_time, created_at, updated_at
    FROM notes WHERE student_id = '$student_id' ORDER BY updated_at DESC LIMIT 5");

$recentNotes = [];
while ($r = $recentResult->fetch_assoc()) {
    $recentNotes[] = $r;
}

// Upcoming assignments with status
$assignmentsResult = $conn->query("SELECT id, course_name, due_date, status FROM assignments WHERE student_id = '$student_id' ORDER BY due_date ASC LIMIT 5");

$upcomingAssignments = [];
$today = new DateTime();
while ($a = $assignmentsResult->fetch_assoc()) {
    $dueDate = new DateTime($a['due_date']);
    $interval = $today->diff($dueDate);
    
    // Determine status badge
    if ($a['status'] === 'submitted') {
        $a['badge'] = 'Submitted';
    } elseif ($a['status'] === 'in_progress') {
        $a['badge'] = 'In Progress';
    } elseif ($dueDate < $today) {
        $a['badge'] = 'Missed';
    } elseif ($interval->days <= 1) {
        $a['badge'] = 'Due Soon';
    } else {
        $a['badge'] = 'Pending';
    }
    $upcomingAssignments[] = $a;
}

echo json_encode([
    'success'      => true,
    'total_notes'  => $totalNotes,
    'text_notes'   => $textNotes,
    'pdf_notes'    => $pdfNotes,
    'recent_notes' => $recentNotes,
    'upcoming_assignments' => $upcomingAssignments,
]);
?>