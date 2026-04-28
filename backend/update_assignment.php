<?php
// update_assignment.php
require_once 'db_config.php';
require_once 'check_auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields.']);
    exit();
}

$id = intval($data['id']);
$course_name = isset($data['course_name']) ? $conn->real_escape_string($data['course_name']) : null;
$due_date = isset($data['due_date']) ? $conn->real_escape_string($data['due_date']) : null;
$status = isset($data['status']) ? $conn->real_escape_string($data['status']) : null;

$updates = [];
if ($course_name !== null) $updates[] = "course_name='$course_name'";
if ($due_date !== null) $updates[] = "due_date='$due_date'";
if ($status !== null) $updates[] = "status='$status'";

if (empty($updates)) {
    echo json_encode(['success' => false, 'message' => 'No fields to update.']);
    exit();
}

$sql = "UPDATE assignments SET " . implode(', ', $updates) . " WHERE id=$id";

if ($conn->query($sql) === TRUE) {
    echo json_encode(['success' => true, 'message' => 'Assignment updated successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error updating assignment: ' . $conn->error]);
}

$conn->close();
