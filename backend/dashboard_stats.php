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

echo json_encode([
    'success'      => true,
    'total_notes'  => $totalNotes,
    'text_notes'   => $textNotes,
    'pdf_notes'    => $pdfNotes,
    'recent_notes' => $recentNotes,
]);
?>