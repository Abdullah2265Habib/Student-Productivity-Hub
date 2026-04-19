<?php
include 'db_config.php';

$email = $_POST['email'];
$password = $_POST['password'];

$query = "SELECT * FROM students WHERE email='$email' AND password='$password'";
mysqli_query($conn, $query);
?>