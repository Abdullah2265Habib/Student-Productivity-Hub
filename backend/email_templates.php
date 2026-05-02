<?php
// ─────────────────────────────────────────────────────────────────────────────
// StudyHub — HTML Email Templates
// ─────────────────────────────────────────────────────────────────────────────

class EmailTemplates {

    /**
     * Build a styled HTML email for upcoming deadline reminders.
     *
     * @param  string $studentName
     * @param  array  $assignments  [['course_name','due_date','status','days_left'], ...]
     * @param  array  $goals        [['goal_text','target_date','status','days_left'], ...]
     * @return string  Full HTML document
     */
    public static function deadlineReminder($studentName, $assignments, $goals) {
        $rows = '';

        foreach ($assignments as $a) {
            $badge = self::urgencyBadge($a['days_left']);
            $rows .= "
            <tr>
                <td style='padding:12px 16px;border-bottom:1px solid #e6ecf5;'>
                    <span style='display:inline-block;width:8px;height:8px;border-radius:50%;background:#3b82f6;margin-right:8px;'></span>
                    Assignment
                </td>
                <td style='padding:12px 16px;border-bottom:1px solid #e6ecf5;font-weight:600;color:#0f1f3a;'>
                    {$a['course_name']}
                </td>
                <td style='padding:12px 16px;border-bottom:1px solid #e6ecf5;'>{$a['due_date']}</td>
                <td style='padding:12px 16px;border-bottom:1px solid #e6ecf5;'>{$badge}</td>
            </tr>";
        }

        foreach ($goals as $g) {
            $badge = self::urgencyBadge($g['days_left']);
            $text  = htmlspecialchars(mb_strimwidth($g['goal_text'], 0, 50, '…'));
            $rows .= "
            <tr>
                <td style='padding:12px 16px;border-bottom:1px solid #e6ecf5;'>
                    <span style='display:inline-block;width:8px;height:8px;border-radius:50%;background:#8b5cf6;margin-right:8px;'></span>
                    Goal
                </td>
                <td style='padding:12px 16px;border-bottom:1px solid #e6ecf5;font-weight:600;color:#0f1f3a;'>
                    {$text}
                </td>
                <td style='padding:12px 16px;border-bottom:1px solid #e6ecf5;'>{$g['target_date']}</td>
                <td style='padding:12px 16px;border-bottom:1px solid #e6ecf5;'>{$badge}</td>
            </tr>";
        }

        $totalItems = count($assignments) + count($goals);
        $itemWord   = $totalItems === 1 ? 'item' : 'items';

        return "
<!DOCTYPE html>
<html><head><meta charset='UTF-8'></head>
<body style='margin:0;padding:0;background:#f6f8fc;font-family:Inter,Segoe UI,system-ui,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0' style='background:#f6f8fc;padding:40px 20px;'>
<tr><td align='center'>
<table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,31,58,.08);'>

  <!-- Header -->
  <tr>
    <td style='background:linear-gradient(135deg,#2563eb,#3b82f6);padding:32px 40px;'>
      <table width='100%'><tr>
        <td>
          <div style='display:inline-block;width:42px;height:42px;background:rgba(255,255,255,.2);border-radius:12px;text-align:center;line-height:42px;font-size:20px;color:#fff;'>🎓</div>
        </td>
        <td style='padding-left:14px;'>
          <div style='font-size:22px;font-weight:800;color:#fff;letter-spacing:-.01em;'>StudyHub</div>
          <div style='font-size:13px;color:rgba(255,255,255,.8);'>Deadline Reminder</div>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- Greeting -->
  <tr>
    <td style='padding:32px 40px 16px;'>
      <h2 style='margin:0 0 8px;font-size:20px;color:#0f1f3a;'>Hey {$studentName} 👋</h2>
      <p style='margin:0;color:#475569;font-size:15px;line-height:1.6;'>
        You have <strong>{$totalItems}</strong> upcoming {$itemWord} with approaching deadlines.
        Don't let them slip — take action today!
      </p>
    </td>
  </tr>

  <!-- Table -->
  <tr>
    <td style='padding:8px 40px 32px;'>
      <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e6ecf5;border-radius:12px;overflow:hidden;font-size:14px;color:#475569;'>
        <tr style='background:#f3f6fb;'>
          <th style='padding:12px 16px;text-align:left;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;'>Type</th>
          <th style='padding:12px 16px;text-align:left;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;'>Name</th>
          <th style='padding:12px 16px;text-align:left;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;'>Due Date</th>
          <th style='padding:12px 16px;text-align:left;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;'>Urgency</th>
        </tr>
        {$rows}
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style='background:#f3f6fb;padding:24px 40px;border-top:1px solid #e6ecf5;'>
      <p style='margin:0;font-size:13px;color:#94a3b8;text-align:center;'>
        You're receiving this because notifications are enabled in your StudyHub settings.
      </p>
    </td>
  </tr>

</table>
</td></tr></table>
</body></html>";
    }

    /**
     * Build a styled test email.
     */
    public static function testEmail($studentName) {
        return "
<!DOCTYPE html>
<html><head><meta charset='UTF-8'></head>
<body style='margin:0;padding:0;background:#f6f8fc;font-family:Inter,Segoe UI,system-ui,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0' style='background:#f6f8fc;padding:40px 20px;'>
<tr><td align='center'>
<table width='520' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,31,58,.08);'>
  <tr>
    <td style='background:linear-gradient(135deg,#2563eb,#3b82f6);padding:32px 40px;text-align:center;'>
      <div style='font-size:48px;margin-bottom:8px;'>✅</div>
      <div style='font-size:22px;font-weight:800;color:#fff;'>Email Works!</div>
    </td>
  </tr>
  <tr>
    <td style='padding:32px 40px;text-align:center;'>
      <h2 style='margin:0 0 8px;font-size:18px;color:#0f1f3a;'>Hey {$studentName} 👋</h2>
      <p style='margin:0;color:#475569;font-size:15px;line-height:1.6;'>
        Your StudyHub notification system is configured correctly.
        You will now receive email reminders when your assignment or goal deadlines are approaching.
      </p>
    </td>
  </tr>
  <tr>
    <td style='background:#f3f6fb;padding:20px 40px;border-top:1px solid #e6ecf5;'>
      <p style='margin:0;font-size:13px;color:#94a3b8;text-align:center;'>StudyHub Notification System</p>
    </td>
  </tr>
</table>
</td></tr></table>
</body></html>";
    }

    /* ── private helpers ──────────────────────────────── */

    private static function urgencyBadge($daysLeft) {
        if ($daysLeft <= 0) {
            return "<span style='display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;background:#fef2f2;color:#ef4444;'>Overdue</span>";
        }
        if ($daysLeft === 1) {
            return "<span style='display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;background:#fef2f2;color:#ef4444;'>Tomorrow!</span>";
        }
        if ($daysLeft <= 3) {
            return "<span style='display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;background:#fffbeb;color:#f59e0b;'>{$daysLeft} days</span>";
        }
        return "<span style='display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;background:#ecfdf5;color:#10b981;'>{$daysLeft} days</span>";
    }
}
