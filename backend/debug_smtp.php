<?php
// ─────────────────────────────────────────────────────────────────────────────
// SMTP Debug — Run this to see the full SMTP conversation
// DELETE THIS FILE after debugging!
// ─────────────────────────────────────────────────────────────────────────────

header('Content-Type: text/plain; charset=utf-8');

$config = require __DIR__ . '/email_config.php';

$user = trim($config['smtp_user'] ?? '');
$pass = str_replace(' ', '', trim($config['smtp_pass'] ?? ''));
$host = $config['smtp_host'] ?? 'smtp.gmail.com';
$port = (int)($config['smtp_port'] ?? 465);

echo "=== SMTP Debug ===\n";
echo "Host: $host\n";
echo "Port: $port\n";
echo "User: $user\n";
echo "Pass length: " . strlen($pass) . " chars\n";
echo "Pass (masked): " . substr($pass, 0, 2) . str_repeat('*', strlen($pass) - 4) . substr($pass, -2) . "\n\n";

// Connect
echo "--- Connecting to ssl://$host:$port ---\n";
$ctx = stream_context_create([
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false,
        'allow_self_signed' => true,
    ]
]);

$socket = @stream_socket_client("ssl://$host:$port", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $ctx);

if (!$socket) {
    echo "FAILED: $errstr ($errno)\n";
    exit;
}

echo "Connected!\n\n";

function smtp_read($socket) {
    $buf = '';
    stream_set_timeout($socket, 10);
    while ($line = @fgets($socket, 515)) {
        $buf .= $line;
        if (isset($line[3]) && $line[3] === ' ') break;
    }
    return $buf;
}

function smtp_cmd($socket, $cmd, $label = '') {
    echo ">>> $label: $cmd\n";
    fputs($socket, $cmd . "\r\n");
    $resp = smtp_read($socket);
    echo "<<< " . trim($resp) . "\n\n";
    return $resp;
}

// Greeting
$greeting = smtp_read($socket);
echo "<<< GREETING: " . trim($greeting) . "\n\n";

// EHLO
smtp_cmd($socket, "EHLO studyhub", "EHLO");

// Try AUTH PLAIN first (more reliable)
$authString = base64_encode("\0" . $user . "\0" . $pass);
echo "--- Trying AUTH PLAIN ---\n";
$authResp = smtp_cmd($socket, "AUTH PLAIN " . $authString, "AUTH PLAIN");

if (strpos($authResp, '235') !== false) {
    echo "*** AUTH PLAIN SUCCESS! ***\n";
} else {
    echo "*** AUTH PLAIN FAILED, trying AUTH LOGIN... ***\n\n";
    
    // Reconnect (server may have closed after failed auth)
    @fclose($socket);
    $socket = @stream_socket_client("ssl://$host:$port", $errno, $errstr, 30, STREAM_CLIENT_CONNECT, $ctx);
    if (!$socket) { echo "Reconnect failed\n"; exit; }
    smtp_read($socket);
    smtp_cmd($socket, "EHLO studyhub", "EHLO");
    
    smtp_cmd($socket, "AUTH LOGIN", "AUTH LOGIN");
    smtp_cmd($socket, base64_encode($user), "USERNAME (b64)");
    $authResp = smtp_cmd($socket, base64_encode($pass), "PASSWORD (b64)");
    
    if (strpos($authResp, '235') !== false) {
        echo "*** AUTH LOGIN SUCCESS! ***\n";
    } else {
        echo "*** AUTH LOGIN ALSO FAILED ***\n";
        echo "\nPossible causes:\n";
        echo "1. The App Password is incorrect or expired\n";
        echo "2. 2-Step Verification is not enabled on this Google account\n";
        echo "3. This is a Google Workspace account with App Passwords disabled by admin\n";
        echo "4. The Google account requires additional security verification\n";
    }
}

@fclose($socket);
echo "\n=== Done ===\n";
