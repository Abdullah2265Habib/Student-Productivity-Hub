<?php
include 'db_config.php';

$name = $_POST['name'];
$email = $_POST['email'];
$password = $_POST['password'];

$query = "INSERT INTO students (name, email, password) VALUES ('$name', '$email', '$password')";

if(mysqli_query($conn, $query)) {
    echo "success";
} else {
    echo "error";
}
?>