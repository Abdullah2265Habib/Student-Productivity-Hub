# 🎓 Student Productivity Hub

> **Live Demo:** [student-productivity-hub.infinityfreeapp.com](http://student-productivity-hub.infinityfreeapp.com/)

A full-stack web application designed to help students manage their academic life — from notes and assignments to study sessions, goals, and analytics. Built with vanilla HTML/CSS/JavaScript on the frontend and PHP/MySQL on the backend.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Email Notifications](#email-notifications)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Known Issues & Limitations](#known-issues--limitations)
- [License](#license)

---

## ✨ Features

### 📝 Notes Manager
- Create and manage text notes with automatic read-time estimation (180 wpm)
- Upload PDF documents as notes (up to 10 MB)
- Inline PDF viewer with full-screen support
- Search, filter by type (text/PDF), and replace PDFs

### 📌 Assignment Tracker
- Add assignments with course name, due date, and status
- Status tracking: Pending, In Progress, Submitted
- Auto-badge system: Due Soon, Missed, Overdue
- Filter assignments by status; responsive table + card view for mobile

### 🍅 Pomodoro Timer
- Three modes: Focus (custom 25/30/45/60 min), Short Break (5 min), Long Break (15 min)
- Animated SVG ring with rotating dot
- Auto-switch to break after a focus session completes
- Saves every completed session to the backend
- Displays today's time, total sessions, and all-time hours

### 🎯 Goals
- Set goals with text, target date, priority (Low/Medium/High), and status
- Filter by status (Pending, In Progress, Completed) and priority
- Change status in one click via the detail modal
- Overdue detection with visual indicators

### 📅 Calendar
- Monthly calendar view with goal deadline dots (colour-coded by priority)
- Custom holiday management — add, view, and delete personal holidays
- Click any date to see that day's goals and holidays in a sidebar panel

### 📊 Analytics Dashboard
- KPI cards: Total Notes, Assignments, Goals, Study Time, Sessions
- Productivity Score (0–100) with breakdown bars for goals, tasks, and study time
- 7-day daily study bar chart
- 4-week weekly study trend (hours + sessions)
- Goal status doughnut, Assignment status doughnut, Notes type pie
- Goals by Priority horizontal bar chart
- 28-day activity heatmap
- Current study streak counter

### 🔔 Email Notifications
- Per-student SMTP configuration (Gmail App Password)
- Configurable: days before deadline, assignments toggle, goals toggle
- Deadline reminder emails with urgency badges (Overdue, Tomorrow, N days)
- Test email to verify setup
- Manual cron trigger via browser or PHP CLI

### ⚙️ Settings
- Update email address
- Change password (plain-text comparison, consistent with signup)
- Notification preferences with toggle UI and days picker

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| UI Libraries | Font Awesome 6.4, Chart.js, Google Fonts (Inter, Fraunces, DM Sans, Plus Jakarta Sans) |
| Backend | PHP 8 (procedural) |
| Database | MySQL / MariaDB |
| Email | Custom SMTP mailer (SSL, port 465, no external library) |
| Hosting | InfinityFree (live demo), XAMPP/WAMP (local) |

---

## 📁 Project Structure

```
Student-Productivity-Hub/
│
├── index.html                        # Landing page
│
├── backend/
│   ├── db_config.php                 # Database connection
│   ├── check_auth.php                # Session authentication guard
│   ├── login.php                     # Login handler
│   ├── logout.php                    # Session destroy
│   ├── signup.php                    # Registration handler
│   ├── get_user.php                  # Fetch logged-in user info
│   │
│   ├── add_notes.php                 # Create text/PDF note
│   ├── get_notes.php                 # Fetch all notes for user
│   ├── update_note.php               # Update text note content
│   ├── delete_note.php               # Delete note + file
│   │
│   ├── add_assignment.php            # Create assignment
│   ├── get_assignments.php           # Fetch assignments
│   ├── update_assignment.php         # Update assignment
│   ├── delete_assignment.php         # Delete assignment
│   │
│   ├── add_goal.php                  # Create goal
│   ├── get_goals.php                 # Fetch goals (with filters)
│   ├── update_goal.php               # Update goal
│   ├── delete_goal.php               # Delete goal
│   │
│   ├── add_holiday.php               # Create holiday
│   ├── get_holidays.php              # Fetch holidays
│   ├── delete_holiday.php            # Delete holiday
│   │
│   ├── timer.php                     # Save & fetch study sessions
│   ├── dashboard_stats.php           # Dashboard summary data
│   ├── analytics_stats.php           # Full analytics data
│   │
│   ├── email_config.php              # System-wide SMTP fallback config
│   ├── smtp_mailer.php               # Custom SSL SMTP mailer class
│   ├── email_templates.php           # HTML email templates
│   ├── notification_cron.php         # Deadline checker + email sender
│   ├── test_notification_email.php   # Send test email
│   ├── get_notification_settings.php # Fetch user notification prefs
│   ├── update_notification_settings.php # Save notification prefs + SMTP
│   │
│   └── uploads/                      # Uploaded PDF files (auto-created)
│
└── frontend/
    ├── assets/
    │   ├── css/
    │   │   ├── app-shell.css         # Sidebar + topbar layout system
    │   │   ├── style.css             # Landing page styles
    │   │   ├── auth.css              # Login/signup shared styles
    │   │   ├── login.css             # Login page specific
    │   │   ├── signup.css            # Signup page specific
    │   │   ├── notes.css             # Notes 2-column layout
    │   │   ├── assignments.css       # Assignments table + cards
    │   │   ├── timer.css             # Pomodoro ring timer
    │   │   ├── goals.css             # Goals grid + modals
    │   │   ├── calendar.css          # Calendar grid + sidebar
    │   │   ├── analytics.css         # KPI cards + charts
    │   │   └── settings.css          # Settings tabs + toggles
    │   │
    │   └── js/
    │       ├── script.js             # Landing page utilities
    │       ├── login.js              # Login form handler
    │       ├── signup.js             # Signup form handler
    │       ├── notes.js              # Notes CRUD + viewer
    │       ├── assignments.js        # Assignments CRUD
    │       ├── timer.js              # Pomodoro timer logic
    │       ├── goals.js              # Goals CRUD + filters
    │       ├── calendar.js           # Calendar rendering + holidays
    │       ├── analytics.js          # Chart.js chart rendering
    │       └── settings.js           # Settings forms + notification UI
    │
    └── pages/
        ├── login.html
        ├── signup.html
        ├── dashboard.html
        ├── notes.html
        ├── assignments.html
        ├── timer.html
        ├── goals.html
        ├── calendar.html
        ├── analytics.html
        ├── settings.html
        └── tasks.html                # Placeholder page
```

---

## 🗄 Database Schema

Create a MySQL database named `StudentProductivityHub` and run the following SQL:

```sql
CREATE DATABASE IF NOT EXISTS StudentProductivityHub
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE StudentProductivityHub;

-- Students (users)
CREATE TABLE students (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Notes
CREATE TABLE notes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT           NOT NULL,
  note_text  TEXT,
  file_path  VARCHAR(500),
  read_time  INT           DEFAULT 0,
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Assignments
CREATE TABLE assignments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT          NOT NULL,
  course_name VARCHAR(200) NOT NULL,
  due_date    DATE         NOT NULL,
  status      ENUM('pending','in_progress','submitted') DEFAULT 'pending',
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Goals
CREATE TABLE goals (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT          NOT NULL,
  goal_text   TEXT         NOT NULL,
  priority    ENUM('low','medium','high') DEFAULT 'medium',
  target_date DATE         NOT NULL,
  status      ENUM('pending','in_progress','completed') DEFAULT 'pending',
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Holidays
CREATE TABLE holidays (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT          NOT NULL,
  name        VARCHAR(200) NOT NULL,
  date        DATE         NOT NULL,
  description TEXT,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Study timer sessions
CREATE TABLE timers (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  student_id         INT NOT NULL,
  session_duration   INT NOT NULL,           -- seconds
  session_start_time DATETIME,
  session_end_time   DATETIME,
  total_study_time   INT DEFAULT 0,          -- cumulative seconds
  date_logged        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Notification settings (one row per student)
CREATE TABLE notification_settings (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  student_id             INT     NOT NULL UNIQUE,
  notifications_enabled  TINYINT DEFAULT 1,
  notify_days_before     INT     DEFAULT 3,
  notify_assignments     TINYINT DEFAULT 1,
  notify_goals           TINYINT DEFAULT 1,
  smtp_email             VARCHAR(200),
  smtp_password          VARCHAR(300),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Notification log (prevents duplicate daily emails)
CREATE TABLE notification_log (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  items_count INT DEFAULT 0,
  sent_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
```

---

## 🚀 Getting Started

### Prerequisites

- **PHP** 7.4 or higher
- **MySQL** 5.7 / MariaDB 10.3 or higher
- A local server stack: **XAMPP**, **WAMP**, **MAMP**, or **Laragon**

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Student-Productivity-Hub.git
   ```

2. **Move the folder** to your web server's root directory:
   - XAMPP → `C:/xampp/htdocs/Student-Productivity-Hub`
   - WAMP  → `C:/wamp64/www/Student-Productivity-Hub`

3. **Create the database** — open phpMyAdmin and run the SQL from the [Database Schema](#database-schema) section above.

4. **Configure the database connection** in `backend/db_config.php`:
   ```php
   $host     = 'localhost';
   $username = 'root';       // your MySQL username
   $password = 'root';       // your MySQL password
   $dbname   = 'StudentProductivityHub';
   ```

5. **Open the app** in your browser:
   ```
   http://localhost/Student-Productivity-Hub/
   ```

6. **Register an account** at `/frontend/pages/signup.html` and start using the app.

---

## ⚙️ Configuration

### Database (`backend/db_config.php`)

```php
$host     = 'localhost';
$username = 'root';
$password = 'your_password';
$dbname   = 'StudentProductivityHub';
```

### System-wide Email Fallback (`backend/email_config.php`)

Optional — lets all users share one SMTP sender if they haven't set up their own. For Gmail, generate an [App Password](https://myaccount.google.com/apppasswords).

```php
return [
    'smtp_host'  => 'smtp.gmail.com',
    'smtp_port'  => 465,
    'smtp_user'  => 'your.email@gmail.com',
    'smtp_pass'  => 'xxxx xxxx xxxx xxxx',   // 16-char App Password
    'from_name'  => 'StudyHub',
    'configured' => true,
];
```

Students can also enter their own SMTP credentials from **Settings → Notifications**, which take priority over this file.

---

## 📖 Usage Guide

### Creating an Account
Navigate to the homepage, click **Sign Up**, fill in your name, email and password.

### Dashboard
The dashboard loads automatically after login and shows:
- Notes count, completed/pending tasks, total study hours
- Recent notes list
- Upcoming assignments with due-date badges
- A 7-day study activity bar chart
- A mini goals calendar

### Managing Notes
1. Go to **My Notes** and click **View My Notes** to load your notes.
2. Click **+ New Note** to choose between writing text or uploading a PDF.
3. Click any note card to open it in the right-hand viewer.
4. Use the ⋮ menu on a card to edit text notes or replace PDFs.

### Tracking Assignments
1. Go to **Assignments** and click **New Assignment**.
2. Enter the course name, due date, and initial status.
3. Filter by status using the buttons at the top.
4. Click the edit icon to update status as work progresses.

### Using the Pomodoro Timer
1. Go to **Pomodoro Timer**.
2. Select a mode tab (Focus / Short Break / Long Break).
3. In Focus mode, choose a duration preset (25/30/45/60 min).
4. Click ▶ to start. The ring animates as time passes.
5. When a focus session completes, it is automatically saved and a break begins.
6. Press **Space** to play/pause from anywhere on the page.

### Setting Goals
1. Go to **Goals** and click **View My Goals**, then **Add Goal**.
2. Fill in the goal text, target date, and priority.
3. Click a goal card to view details, change its status, edit, or delete it.

### Using the Calendar
1. Go to **Calendar**. Goals appear as colour-coded dots on their target dates.
2. Click any date to see that day's goals and holidays in the right panel.
3. Click **Add Holiday** (or the nudge button on a date) to record a custom holiday.

### Viewing Analytics
Go to **Analytics** to see all your stats rendered as interactive Chart.js charts. Data updates in real time from the backend on each page load.

---

## 📧 Email Notifications

StudyHub can send you an email reminder before assignment or goal deadlines.

### Setup (per-student)
1. Go to **Settings → Notifications**.
2. Scroll to **Email Setup (Gmail SMTP)**.
3. Follow the on-screen steps to create a Gmail App Password.
4. Enter your Gmail address and the 16-character App Password, then click **Save Email Setup**.
5. Click **Send Test** to verify everything works — you should receive a confirmation email.

### Automated Sending
The notification check is in `backend/notification_cron.php`. It:
- Looks up all students with notifications enabled
- Finds assignments/goals due within their configured window
- Skips students already notified today (via `notification_log`)
- Sends a styled HTML email per student

**To automate it, set up a scheduled task or cron job:**

```bash
# Linux cron (daily at 8 AM)
0 8 * * * php /path/to/backend/notification_cron.php

# Windows Task Scheduler
php "C:\xampp\htdocs\Student-Productivity-Hub\backend\notification_cron.php"
```

You can also trigger it manually from **Settings → Notifications → Run Now**, or by visiting:
```
http://localhost/Student-Productivity-Hub/backend/notification_cron.php?key=studyhub_notify_2026
```

---

## 🌐 Deployment

### Deployed on InfinityFree

**Live URL:** [http://student-productivity-hub.infinityfreeapp.com](http://student-productivity-hub.infinityfreeapp.com)

Steps used to deploy:

1. Created a free account at [infinityfree.com](https://infinityfree.com) and set up a hosting account.
2. Exported the local MySQL database and imported it via the InfinityFree phpMyAdmin panel.
3. Updated `backend/db_config.php` with the InfinityFree MySQL hostname, username, password, and database name.
4. Uploaded all project files via the InfinityFree File Manager or FTP (credentials in the control panel).
5. Verified the live URL loads correctly and tested login, notes, and timer features.

### General Shared Hosting Tips
- Make sure `backend/uploads/` has write permissions (`chmod 755` or `777`).
- InfinityFree does not support outbound SMTP on port 465 from PHP — use an external relay or a service like [Gmail SMTP via cURL workaround](https://developers.google.com/gmail/api) if you need notifications on free hosting.
- The cron job URL trigger (`?key=studyhub_notify_2026`) can be added to InfinityFree's built-in cron scheduler.

---

## 🔒 Security Notes

> This project was built for educational purposes. The following are known areas for improvement before use in a production environment:

- **Passwords are stored in plain text.** For production, replace with `password_hash()` / `password_verify()`.
- Several backend files use string interpolation in SQL queries (e.g., `login.php`, `add_assignment.php`). Replace with **prepared statements** throughout to prevent SQL injection.
- Sessions use the default PHP session handler — consider adding `session_regenerate_id()` on login.
- The cron endpoint uses a simple secret key; in production, restrict access to CLI only or use a stronger token.

---

## 🐛 Known Issues & Limitations

- The **name field** is stored at signup but the Settings page only allows updating the email (not the name) without a backend change.
- On **InfinityFree free hosting**, outbound SMTP port 465 may be blocked, preventing notification emails from sending.
- The `delete_assignment.php` endpoint does not verify that the assignment belongs to the logged-in user — fix by joining with the `students` table.
- No pagination on notes or assignments lists — could be slow for users with many records.
- `tasks.html` is a placeholder page with no functionality yet.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  <p>Built with ❤️ for students everywhere</p>
  <p><a href="http://student-productivity-hub.infinityfreeapp.com">🌐 Live Demo</a></p>
</div>
