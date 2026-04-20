<?php
session_start();

if(!isset($_SESSION['email'])) {
    echo "unauthorized";
} else {
    echo "authorized";
}
?>