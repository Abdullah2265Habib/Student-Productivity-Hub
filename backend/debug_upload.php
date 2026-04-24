<?php
// Diagnostic script — open this URL directly in the browser while logged in:
// http://localhost:PORT/Student-Productivity-Hub/backend/debug_upload.php
header('Content-Type: text/plain');
session_start();

echo "=== SESSION ===\n";
echo "email: "      . ($_SESSION['email']   ?? 'NOT SET') . "\n";

echo "\n=== PHP UPLOAD SETTINGS ===\n";
echo "file_uploads: "      . ini_get('file_uploads')      . "\n";
echo "upload_max_filesize: ". ini_get('upload_max_filesize') . "\n";
echo "post_max_size: "     . ini_get('post_max_size')     . "\n";
echo "upload_tmp_dir: "    . ini_get('upload_tmp_dir')    . "\n";

echo "\n=== UPLOADS DIR ===\n";
$dir = __DIR__ . '/uploads/';
echo "Path: $dir\n";
echo "Exists: "    . (is_dir($dir) ? 'YES' : 'NO') . "\n";
echo "Writable: "  . (is_writable($dir) ? 'YES' : (is_dir($dir) ? 'NO — fix permissions' : 'N/A (dir missing)')) . "\n";

echo "\n=== FUNCTIONS ===\n";
echo "mime_content_type: " . (function_exists('mime_content_type') ? 'available' : 'NOT available') . "\n";
echo "finfo_open: "        . (function_exists('finfo_open')        ? 'available' : 'NOT available') . "\n";

echo "\n=== DB CONNECTION ===\n";
include 'db_config.php';
echo "Connected: " . ($conn ? 'YES' : 'NO — ' . mysqli_connect_error()) . "\n";

if ($conn && isset($_SESSION['email'])) {
    $e = $_SESSION['email'];
    $r = $conn->query("SELECT id FROM students WHERE email='$e' LIMIT 1");
    $row = $r ? $r->fetch_assoc() : null;
    echo "Student ID for {$e}: " . ($row ? $row['id'] : 'NOT FOUND in students table') . "\n";
}
?>
