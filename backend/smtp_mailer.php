<?php
// ─────────────────────────────────────────────────────────────────────────────
// StudyHub — Lightweight SMTP Mailer (zero external dependencies)
// Supports SSL connections (port 465) for Gmail, Outlook, etc.
// ─────────────────────────────────────────────────────────────────────────────

class StudyHubMailer {

    private $host;
    private $port;
    private $user;
    private $pass;
    private $fromName;
    private $configured;

    public function __construct() {
        $config = require __DIR__ . '/email_config.php';
        $this->host      = $config['smtp_host']  ?? '';
        $this->port      = (int)($config['smtp_port'] ?? 465);
        $this->user      = trim($config['smtp_user']  ?? '');
        $this->pass      = str_replace(' ', '', trim($config['smtp_pass']  ?? ''));
        $this->fromName  = $config['from_name']  ?? 'StudyHub';
        $this->configured = (bool)($config['configured'] ?? false);
    }

    /** Check whether SMTP credentials have been supplied */
    public function isConfigured() {
        return $this->configured && !empty($this->user) && !empty($this->pass);
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
                'error'   => 'SMTP not configured. Edit backend/email_config.php with your credentials and set configured to true.'
            ];
        }

        // SSL context (disable peer verification for local dev)
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
                throw new Exception('SMTP authentication failed. Server response: ' . trim($auth));
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
