<?php
// update_assignment.php
require_once 'db_config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'], $data['course_name'], $data['due_date'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit();
}

$id = intval($data['id']);
$course_name = $conn->real_escape_string($data['course_name']);
$due_date = $conn->real_escape_string($data['due_date']);

$sql = "UPDATE assignments SET course_name='$course_name', due_date='$due_date' WHERE id=$id";

if ($conn->query($sql) === TRUE) {
    echo json_encode(['success' => true, 'message' => 'Assignment updated successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error updating assignment: ' . $conn->error]);
}

$conn->close();
