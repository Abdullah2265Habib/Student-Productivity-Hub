<?php
require_once 'db_config.php';
require_once 'check_auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

$email = $_SESSION['email'];
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['course_name'], $data['due_date'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit();
}

$studentResult = $conn->query("SELECT id FROM students WHERE email = '$email'");
$studentRow = $studentResult->fetch_assoc();
$student_id = $studentRow['id'];

$course_name = $conn->real_escape_string($data['course_name']);
$due_date = $conn->real_escape_string($data['due_date']);
$status = isset($data['status']) ? $conn->real_escape_string($data['status']) : 'pending';

$sql = "INSERT INTO assignments (student_id, course_name, due_date, status) VALUES ($student_id, '$course_name', '$due_date', '$status')";

if ($conn->query($sql) === TRUE) {
    echo json_encode(['success' => true, 'message' => 'Assignment added successfully.', 'id' => $conn->insert_id]);
} else {
    echo json_encode(['success' => false, 'message' => 'Error adding assignment: ' . $conn->error]);
}

$conn->close();