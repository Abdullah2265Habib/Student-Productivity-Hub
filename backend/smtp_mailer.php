<?php
// ─────────────────────────────────────────────────────────────────────────────
// StudyHub — Lightweight SMTP Mailer (zero external dependencies)
// Supports SSL connections (port 465) for Gmail, Outlook, etc.
//
// Credentials can come from:
//   1. Per-student DB settings (smtp_email / smtp_password in notification_settings)
//   2. Fallback: backend/email_config.php (server-wide default)
// ─────────────────────────────────────────────────────────────────────────────

class StudyHubMailer {

    private $host;
    private $port;
    private $user;
    private $pass;
    private $fromName;

    /**
     * @param string|null $smtpEmail    Per-student SMTP email (from DB)
     * @param string|null $smtpPassword Per-student SMTP password (from DB)
     */
    public function __construct($smtpEmail = null, $smtpPassword = null) {

        // Default from config file
        $config = require __DIR__ . '/email_config.php';
        $this->host     = $config['smtp_host'] ?? 'smtp.gmail.com';
        $this->port     = (int)($config['smtp_port'] ?? 465);
        $this->fromName = $config['from_name'] ?? 'StudyHub';

        // Per-student credentials override the config file
        if (!empty($smtpEmail) && !empty($smtpPassword)) {
            $this->user = trim($smtpEmail);
            $this->pass = str_replace(' ', '', trim($smtpPassword));
        } else {
            $this->user = trim($config['smtp_user'] ?? '');
            $this->pass = str_replace(' ', '', trim($config['smtp_pass'] ?? ''));
        }
    }

    /** Check whether SMTP credentials have been supplied */
    public function isConfigured() {
        return !empty($this->user) && !empty($this->pass);
    }

    /** Return the sender address being used */
    public function getSenderEmail() {
        return $this->user;
    }

    /**
     * Send an HTML email via SMTP over SSL.
     *
     * @param  string $to        Recipient address
     * @param  string $subject   Email subject
     * @param  string $htmlBody  HTML content
     * @return array  ['success'=>bool, 'message'|'error'=>string]
     */
    public function send($to, $subject, $htmlBody) {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'error'   => 'SMTP not configured. Go to Settings → Notifications and enter your Gmail address and App Password.'
            ];
        }

        // SSL context (disable peer verification for local dev / shared hosting)
        $ctx = stream_context_create([
            'ssl' => [
                'verify_peer'       => false,
                'verify_peer_name'  => false,
                'allow_self_signed' => true,
            ]
        ]);

        $socket = @stream_socket_client(
            "ssl://{$this->host}:{$this->port}",
            $errno, $errstr, 30,
            STREAM_CLIENT_CONNECT, $ctx
        );

        if (!$socket) {
            return ['success' => false, 'error' => "SMTP connection failed: $errstr ($errno)"];
        }

        try {
            $this->read($socket);                                          // 220 greeting
            $this->cmd($socket, "EHLO studyhub");
            $this->cmd($socket, "AUTH LOGIN");
            $this->cmd($socket, base64_encode($this->user));
            $auth = $this->cmd($socket, base64_encode($this->pass));

            if (strpos($auth, '235') === false) {
                throw new Exception('SMTP authentication failed. Please check your Gmail address and App Password in Settings → Notifications.');
            }

            $this->cmd($socket, "MAIL FROM:<{$this->user}>");
            $this->cmd($socket, "RCPT TO:<{$to}>");
            $this->cmd($socket, "DATA");                                   // 354

            // Compose message
            $msg  = "From: {$this->fromName} <{$this->user}>\r\n";
            $msg .= "To: {$to}\r\n";
            $msg .= "Subject: {$subject}\r\n";
            $msg .= "MIME-Version: 1.0\r\n";
            $msg .= "Content-Type: text/html; charset=UTF-8\r\n";
            $msg .= "X-Mailer: StudyHub-Notifications\r\n";
            $msg .= "\r\n";
            $msg .= $htmlBody;

            fputs($socket, $msg . "\r\n.\r\n");                           // end-of-data
            $resp = $this->read($socket);

            $this->cmd($socket, "QUIT");
            fclose($socket);

            if (strpos($resp, '250') !== false) {
                return ['success' => true, 'message' => 'Email sent successfully!'];
            }

            return ['success' => false, 'error' => 'Server rejected email: ' . trim($resp)];

        } catch (Exception $e) {
            @fclose($socket);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /* ── helpers ─────────────────────────────────────── */

    private function cmd($socket, $c) {
        fputs($socket, $c . "\r\n");
        return $this->read($socket);
    }

    private function read($socket) {
        $buf = '';
        stream_set_timeout($socket, 10);
        while ($line = @fgets($socket, 515)) {
            $buf .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $buf;
    }
}
