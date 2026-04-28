<?php
// get_assignments.php
require_once 'db_config.php';

header('Content-Type: application/json');

if (!isset($_GET['student_id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing student_id.']);
    exit();
}

$student_id = intval($_GET['student_id']);

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
