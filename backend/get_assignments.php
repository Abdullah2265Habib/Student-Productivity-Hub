<?php
// get_assignments.php
require_once 'db_config.php';
require_once 'check_auth.php';

header('Content-Type: application/json');

$email = $_SESSION['email'];

$studentResult = $conn->query("SELECT id FROM students WHERE email = '$email'");
$studentRow = $studentResult->fetch_assoc();
$student_id = $studentRow['id'];

$sql = "SELECT * FROM assignments WHERE student_id = $student_id ORDER BY due_date ASC";
$result = $conn->query($sql);

$assignments = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $assignments[] = $row;
    }
}

echo json_encode(['success' => true, 'assignments' => $assignments]);

$conn->close();
