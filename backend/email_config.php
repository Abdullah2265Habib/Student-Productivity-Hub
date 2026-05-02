<?php
// ─────────────────────────────────────────────────────────────────────────────
// StudyHub — Email / SMTP Configuration
// Edit these settings to enable email notifications.
//
// For Gmail:
//   1. Enable 2-Step Verification on your Google Account
//   2. Go to https://myaccount.google.com/apppasswords
//   3. Generate an App Password for "Mail"
//   4. Use that 16-char password below (NOT your regular Gmail password)
// ─────────────────────────────────────────────────────────────────────────────

return [
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 465,
    'smtp_user' => 'abdullah2265habib@gmail.com',          // e.g. your.email@gmail.com
    'smtp_pass' => 'xqyt ujeb jmef usrj',          // Gmail App Password (16 characters)
    'from_name' => 'StudyHub',

    // Set to true once you have configured the above credentials
    'configured' => true,
];
