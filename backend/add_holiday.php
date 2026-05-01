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

// Inputs
$name        = trim($_POST['name']        ?? '');
$date        = trim($_POST['date']        ?? '');
$description = trim($_POST['description'] ?? '');

// Validation
if (empty($name)) {
    echo json_encode(['success' => false, 'message' => 'Holiday name is required']);
    exit;
}

if (empty($date)) {
    echo json_encode(['success' => false, 'message' => 'Date is required']);
    exit;
}

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !strtotime($date)) {
    echo json_encode(['success' => false, 'message' => 'Invalid date format']);
    exit;
}

// Insert
$stmt = $conn->prepare(
    "INSERT INTO holidays (student_id, name, date, description) VALUES (?, ?, ?, ?)"
);
$stmt->bind_param("isss", $student_id, $name, $date, $description);

if ($stmt->execute()) {
    $new_id = $conn->insert_id;

    // Return the full inserted row
    $get = $conn->prepare("SELECT id, name, date, description, created_at FROM holidays WHERE id = ?");
    $get->bind_param("i", $new_id);
    $get->execute();
    $holiday = $get->get_result()->fetch_assoc();

    echo json_encode(['success' => true, 'message' => 'Holiday added successfully', 'holiday' => $holiday]);
} else {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $conn->error]);
}
?>