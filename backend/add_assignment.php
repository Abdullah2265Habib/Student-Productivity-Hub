<?php
include 'db_connect.php';
include 'config_auth.php';

$title = $_POST['title'] ?? '';
$student_id = $conn->query("SELECT id FROM students WHERE email = '$email'");
$course_name = $_POST['course_name'] ?? '';
$due_date = $_POST['due_date'] ?? '';

$query = "INSERT INTO assignments (title, student_id, course_name, due_date) VALUES ('$title', '$student_id', '$course_name', '$due_date')";

if (mysqli_query($conn, $query)) {
    echo "Assignment added successfully";
} else {
    echo "Error: " . $query . "<br>" . mysqli_error($conn);
}

?>