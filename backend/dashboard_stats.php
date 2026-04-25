<?php
include 'db_config.php';
include 'check_auth.php';

$email = $_SESSION['email'];

// Get student_id
$stu = $conn->query("SELECT id FROM students WHERE email = '$email'");
$row = $stu->fetch_assoc();
$student_id = $row['id'];

// Total notes count
$countStmt = $conn->query("SELECT COUNT(*) as total FROM notes WHERE student_id = '$student_id'");
$countRow = $countStmt->fetch_assoc();
$totalNotes = (int)$countRow['total'];

// Text notes count
$textStmt = $conn->query("SELECT COUNT(*) as total FROM notes WHERE student_id = '$student_id' AND (file_path IS NULL OR file_path = '')");
$textRow = $textStmt->fetch_assoc();
$textNotes = (int)$textRow['total'];

// PDF notes count
$pdfStmt = $conn->query("SELECT COUNT(*) as total FROM notes WHERE student_id = '$student_id' AND file_path IS NOT NULL AND file_path != ''");
$pdfStmt->execute();
$pdfRow = $pdfStmt->get_result()->fetch_assoc();
$pdfNotes = (int)$pdfRow['total'];

// Recent 5 notes
$recentStmt = $conn->query("SELECT id, note_text, file_path, read_time, created_at, updated_at
    FROM notes WHERE student_id = '$student_id' ORDER BY updated_at DESC LIMIT 5"
);
$recentStmt->execute();
$recentResult = $recentStmt->get_result();

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