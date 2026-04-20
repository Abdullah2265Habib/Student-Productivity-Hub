<?php
session_start();
include 'db_config.php';

$email = $_POST['email'];
$password = $_POST['password'];

$query = "SELECT * FROM students WHERE email='$email' AND password='$password'";
$result = mysqli_query($conn, $query);

if(mysqli_num_rows($result) > 0) {
    $_SESSION['email'] = $email;
    echo "success";
} else {
    echo "error";
}
?>