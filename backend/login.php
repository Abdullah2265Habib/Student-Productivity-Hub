<?php
include 'db_config.php';

$email = $_POST['email'];
$password = $_POST['password'];

$query = "SELECT * FROM students WHERE email='$email' AND password='$password'";
$result = mysqli_query($conn, $query);

if(mysqli_num_rows($result) > 0) {
    echo "success";
    $_SESSION['email'] = $email;
} else {
    echo "error";
}
?>