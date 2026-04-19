<?php
include 'db_config.php';

$name = $_POST['name'];
$email = $_POST['email'];

$query = "INSERT INTO students (name, email) VALUES ('$name', '$email')";

mysqli_query($conn, $query);
?>