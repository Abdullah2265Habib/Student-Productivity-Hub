<?php
include 'db_config.php';
include 'check_auth.php';

header('Content-Type: application/json');

$email = $_SESSION['email'];

// Get student_id
$stu = $conn->prepare("SELECT id FROM students WHERE email = ?");
$stu->bind_param("s", $email);
$stu->execute();
$row = $stu->get_result()->fetch_assoc();
$student_id = $row['id'] ?? null;

if (!$student_id) {
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    exit;
}

// Optional filter by month/year
$month = isset($_GET['month']) ? (int)$_GET['month'] : null;
$year  = isset($_GET['year'])  ? (int)$_GET['year']  : null;

if ($month && $year) {
    $stmt = $conn->prepare(
        "SELECT id, name, date, description, created_at
         FROM holidays
         WHERE student_id = ?
           AND MONTH(date) = ?
           AND YEAR(date)  = ?
         ORDER BY date ASC"
    );
    $stmt->bind_param("iii", $student_id, $month, $year);
} else {
    $stmt = $conn->prepare(
        "SELECT id, name, date, description, created_at
         FROM holidays
         WHERE student_id = ?
         ORDER BY date ASC"
    );
    $stmt->bind_param("i", $student_id);
}

$stmt->execute();
$result = $stmt->get_result();

$holidays = [];
while ($row = $result->fetch_assoc()) {
    $holidays[] = $row;
}

echo json_encode(['success' => true, 'holidays' => $holidays]);
?>