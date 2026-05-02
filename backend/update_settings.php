<?php
session_start();
include "db_config.php";

// Set JSON content type
header('Content-Type: application/json');

// Check authentication
if (!isset($_SESSION['email'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

$action = $_POST['action'] ?? '';
$session_email = $_SESSION['email'];

if ($action === 'update_profile') {
    $name = trim($_POST['name'] ?? '');
    $new_email = trim($_POST['email'] ?? '');

    if (empty($new_email)) {
        echo json_encode(["success" => false, "message" => "Email are required"]);
        exit;
    }
    
    if (!filter_var($new_email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "Invalid email format"]);
        exit;
    }

    // Check if new email is already taken by someone else
    if ($new_email !== $session_email) {
        $stmt = $conn->prepare("SELECT email FROM students WHERE email = ?");
        $stmt->bind_param("s", $new_email);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            echo json_encode(["success" => false, "message" => "Email address is already in use"]);
            exit;
        }
    }

    $stmt = $conn->prepare("UPDATE students SET email = ? WHERE email = ?");
    $stmt->bind_param("ss", $new_email, $session_email);
    
    if ($stmt->execute()) {
        // Update session with new email
        $_SESSION['email'] = $new_email; 
        echo json_encode(["success" => true, "message" => "Profile updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
    }

} elseif ($action === 'update_password') {
    $current_password = $_POST['current_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';

    if (empty($current_password) || empty($new_password)) {
        echo json_encode(["success" => false, "message" => "Passwords are required"]);
        exit;
    }

    if (strlen($new_password) < 6) {
        echo json_encode(["success" => false, "message" => "New password must be at least 6 characters"]);
        exit;
    }

    // Fetch current password hash
    $stmt = $conn->prepare("SELECT password FROM students WHERE email = ?");
    $stmt->bind_param("s", $session_email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "User not found"]);
        exit;
    }
    
    $user = $result->fetch_assoc();
    $hash = $user['password'];

    // Verify current password
    if ($current_password !== $hash) {
        echo json_encode(["success" => false, "message" => "Incorrect current password"]);
        exit;
    }

    // Store new password as plain text (consistent with signup.php)
    $new_hash = $new_password;

    $stmt = $conn->prepare("UPDATE students SET password = ? WHERE email = ?");
    $stmt->bind_param("ss", $new_hash, $session_email);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Password updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Database error"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Unknown action"]);
}

$conn->close();
?>
