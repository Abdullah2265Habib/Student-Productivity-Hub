<?php
session_start();

include "db_config.php";
include "check_auth.php";

header('Content-Type: application/json');

// Check if email exists in session
if (!isset($_SESSION['email'])) {
    echo json_encode([
        "success" => false,
        "error" => "No session email"
    ]);
    exit;
}

$email = $_SESSION['email'];

// Use prepared statement (SAFE)
$stmt = $conn->prepare("SELECT name FROM students WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if (!$result) {
    echo json_encode([
        "success" => false,
        "error" => "Query failed"
    ]);
    exit;
}

$user = $result->fetch_assoc();

if (!$user) {
    echo json_encode([
        "success" => false,
        "error" => "User not found"
    ]);
    exit;
}

echo json_encode([
    "success" => true,
    "user" => $user
]);
exit;
?>