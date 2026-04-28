<?php
// delete_assignment.php
include 'db_config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['id'])) {
    echo json_encode(['success' => false, 'message' => 'Missing assignment id.']);
    exit();
}

$id = intval($data['id']);

$sql = "DELETE FROM assignments WHERE id = $id";

if ($conn->query($sql) === TRUE) {
    echo json_encode(['success' => true, 'message' => 'Assignment deleted successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error deleting assignment: ' . $conn->error]);
}

$conn->close();
