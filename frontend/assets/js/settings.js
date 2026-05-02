/* =====================================================
   Settings Page JavaScript
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ── Tab Navigation ────────────────────────────────
    const tabs = document.querySelectorAll('.settings-tab');
    const sections = document.querySelectorAll('.settings-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.add('active');
        });
    });

    // ── Toggle Password Visibility ────────────────────
    const toggleBtns = document.querySelectorAll('.toggle-password');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.currentTarget.previousElementSibling;
            const icon = e.currentTarget.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // ── Load User Info ────────────────────────────────
    fetch("../../backend/get_user.php", { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.user) {
                const name = data.user.name || 'Student';
                const email = data.user.email || '';
                const initial = name.trim().charAt(0).toUpperCase() || 'S';
                
                // Sidebar
                document.getElementById('sidebarName').textContent = name;
                document.getElementById('sidebarAvatar').textContent = initial;
                
                // Main Profile Card
                document.getElementById('mainName').textContent = name;
                document.getElementById('mainEmail').textContent = email;
                document.getElementById('mainAvatar').textContent = initial;

                // Form Inputs
                document.getElementById('updateEmail').value = email;
                
                // Member since (using created_at if available, else fallback)
                if (data.user.created_at) {
                    const year = new Date(data.user.created_at).getFullYear();
                    document.getElementById('memberSince').textContent = `Member since ${year}`;
                }
            }
        })
        .catch(err => console.error("Error fetching user:", err));

    // ── Password Requirement validation ───────────────
    const newPasswordInput = document.getElementById('newPassword');
    const reqLength = document.getElementById('req-length');

    newPasswordInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length >= 6) {
            reqLength.classList.add('valid');
            reqLength.innerHTML = '<i class="fas fa-check"></i> Minimum 6 characters';
        } else {
            reqLength.classList.remove('valid');
            reqLength.innerHTML = '<i class="fas fa-circle"></i> Minimum 6 characters';
        }
    });

    // ── Profile Form Submit ───────────────────────────
    const profileForm = document.getElementById('profileForm');
    const saveProfileBtn = document.getElementById('saveProfileBtn');

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('updateEmail').value.trim();

        if (!email) {
            showToast('error', 'Validation Error', 'Please fill in all fields.');
            return;
        }

        saveProfileBtn.disabled = true;
        saveProfileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const formData = new FormData();
        formData.append('action', 'update_profile');
        formData.append('email', email);

        fetch('../../backend/update_settings.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';

            if (data.success) {
                showToast('success', 'Profile Updated', 'Your personal information has been saved.');
                // Update UI visually
                document.getElementById('mainEmail').textContent = email;
                const initial = name.charAt(0).toUpperCase();
                document.getElementById('mainAvatar').textContent = initial;
                document.getElementById('sidebarAvatar').textContent = initial;
            } else {
                showToast('error', 'Update Failed', data.message || 'An error occurred.');
            }
        })
        .catch(err => {
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
            showToast('error', 'Network Error', 'Could not connect to the server.');
        });
    });

    // ── Password Form Submit ──────────────────────────
    const passwordForm = document.getElementById('passwordForm');
    const savePasswordBtn = document.getElementById('savePasswordBtn');

    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentPass = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;

        if (newPass !== confirmPass) {
            showToast('error', 'Password Mismatch', 'New passwords do not match.');
            return;
        }

        if (newPass.length < 6) {
            showToast('error', 'Weak Password', 'New password must be at least 6 characters.');
            return;
        }

        savePasswordBtn.disabled = true;
        savePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

        const formData = new FormData();
        formData.append('action', 'update_password');
        formData.append('current_password', currentPass);
        formData.append('new_password', newPass);

        fetch('../../backend/update_settings.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            savePasswordBtn.disabled = false;
            savePasswordBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';

            if (data.success) {
                showToast('success', 'Password Updated', 'Your password has been changed successfully.');
                passwordForm.reset();
                reqLength.classList.remove('valid');
                reqLength.innerHTML = '<i class="fas fa-circle"></i> Minimum 6 characters';
            } else {
                showToast('error', 'Update Failed', data.message || 'An error occurred.');
            }
        })
        .catch(err => {
            savePasswordBtn.disabled = false;
            savePasswordBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
            showToast('error', 'Network Error', 'Could not connect to the server.');
        });
    });

    // ═══════════════════════════════════════════════════════
    //  Notification Settings
    // ═══════════════════════════════════════════════════════

    const notifEnabled     = document.getElementById('notifEnabled');
    const notifOptions     = document.getElementById('notifOptions');
    const notifAssignments = document.getElementById('notifAssignments');
    const notifGoals       = document.getElementById('notifGoals');
    const daysValue        = document.getElementById('daysValue');
    const daysMinus        = document.getElementById('daysMinus');
    const daysPlus         = document.getElementById('daysPlus');
    const smtpStatus       = document.getElementById('smtpStatus');
    const notifForm        = document.getElementById('notifForm');
    const saveNotifBtn     = document.getElementById('saveNotifBtn');
    const testEmailBtn     = document.getElementById('testEmailBtn');
    const runCronBtn       = document.getElementById('runCronBtn');
    const notifResult      = document.getElementById('notifResult');

    let currentDays = 3;

    // Guard: only init if elements exist (notification section present)
    if (notifEnabled) {

        // ── Load saved settings ──────────────────────────
        fetch('../../backend/get_notification_settings.php', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (!data.success) return;

                const s = data.settings;
                notifEnabled.checked     = !!parseInt(s.notifications_enabled);
                notifAssignments.checked = !!parseInt(s.notify_assignments);
                notifGoals.checked       = !!parseInt(s.notify_goals);
                currentDays              = parseInt(s.notify_days_before) || 3;
                daysValue.textContent    = currentDays;

                toggleOptions();
                updateSmtpBanner(data.smtp_configured);
            })
            .catch(() => updateSmtpBanner(false));

        // ── Master toggle ────────────────────────────────
        notifEnabled.addEventListener('change', toggleOptions);

        function toggleOptions() {
            if (notifEnabled.checked) {
                notifOptions.classList.remove('disabled');
            } else {
                notifOptions.classList.add('disabled');
            }
        }

        // ── Days +/– buttons ─────────────────────────────
        daysMinus.addEventListener('click', () => {
            if (currentDays > 1) {
                currentDays--;
                daysValue.textContent = currentDays;
            }
        });

        daysPlus.addEventListener('click', () => {
            if (currentDays < 14) {
                currentDays++;
                daysValue.textContent = currentDays;
            }
        });

        // ── Save preferences ─────────────────────────────
        notifForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveNotifBtn.disabled = true;
            saveNotifBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            fetch('../../backend/update_notification_settings.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notifications_enabled: notifEnabled.checked ? 1 : 0,
                    notify_days_before:    currentDays,
                    notify_assignments:    notifAssignments.checked ? 1 : 0,
                    notify_goals:          notifGoals.checked ? 1 : 0,
                })
            })
            .then(r => r.json())
            .then(data => {
                saveNotifBtn.disabled = false;
                saveNotifBtn.innerHTML = '<i class="fas fa-save"></i> Save Preferences';
                if (data.success) {
                    showToast('success', 'Saved', data.message);
                } else {
                    showToast('error', 'Error', data.message || 'Could not save settings.');
                }
            })
            .catch(() => {
                saveNotifBtn.disabled = false;
                saveNotifBtn.innerHTML = '<i class="fas fa-save"></i> Save Preferences';
                showToast('error', 'Network Error', 'Could not connect to the server.');
            });
        });

        // ── Test Email Button ────────────────────────────
        testEmailBtn.addEventListener('click', () => {
            testEmailBtn.disabled = true;
            testEmailBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            showResult('info', '<i class="fas fa-spinner fa-spin"></i> Sending test email to your address…');

            fetch('../../backend/test_notification_email.php', { credentials: 'include' })
                .then(r => r.json())
                .then(data => {
                    testEmailBtn.disabled = false;
                    testEmailBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Test';
                    if (data.success) {
                        showResult('success', '<i class="fas fa-check-circle"></i> ' + (data.message || 'Test email sent! Check your inbox.'));
                        showToast('success', 'Email Sent', 'Check your inbox for the test email.');
                    } else {
                        showResult('error', '<i class="fas fa-times-circle"></i> ' + (data.error || 'Failed to send test email.'));
                        showToast('error', 'Email Failed', data.error || 'Could not send test email.');
                    }
                })
                .catch(() => {
                    testEmailBtn.disabled = false;
                    testEmailBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Test';
                    showResult('error', '<i class="fas fa-times-circle"></i> Network error — could not reach the server.');
                });
        });

        // ── Run Cron Button ──────────────────────────────
        runCronBtn.addEventListener('click', () => {
            runCronBtn.disabled = true;
            runCronBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
            showResult('info', '<i class="fas fa-spinner fa-spin"></i> Checking deadlines for all students…');

            fetch('../../backend/notification_cron.php?key=studyhub_notify_2026', { credentials: 'include' })
                .then(r => r.json())
                .then(data => {
                    runCronBtn.disabled = false;
                    runCronBtn.innerHTML = '<i class="fas fa-play"></i> Run Now';
                    if (data.success) {
                        let msg = `<i class="fas fa-check-circle"></i> Done! <strong>${data.emails_sent}</strong> email(s) sent.`;
                        if (data.errors && data.errors.length) {
                            msg += `<br><small style="opacity:.7">${data.errors.length} error(s) occurred.</small>`;
                        }
                        showResult(data.emails_sent > 0 ? 'success' : 'info', msg);
                        if (data.emails_sent > 0) {
                            showToast('success', 'Notifications Sent', `${data.emails_sent} email(s) dispatched.`);
                        } else {
                            showToast('success', 'Check Complete', 'No pending deadlines found or already notified today.');
                        }
                    } else {
                        showResult('error', '<i class="fas fa-times-circle"></i> ' + (data.error || 'Notification check failed.'));
                    }
                })
                .catch(() => {
                    runCronBtn.disabled = false;
                    runCronBtn.innerHTML = '<i class="fas fa-play"></i> Run Now';
                    showResult('error', '<i class="fas fa-times-circle"></i> Network error.');
                });
        });

    } // end notifEnabled guard

    // ── Helpers ───────────────────────────────────────────
    function updateSmtpBanner(configured) {
        if (!smtpStatus) return;
        smtpStatus.className = 'notif-smtp-status ' + (configured ? 'configured' : 'not-configured');
        smtpStatus.innerHTML = configured
            ? `<div class="smtp-icon"><i class="fas fa-check-circle"></i></div>
               <div class="smtp-text"><strong>SMTP configured</strong> — Your email notifications are ready to go.</div>`
            : `<div class="smtp-icon"><i class="fas fa-exclamation-triangle"></i></div>
               <div class="smtp-text"><strong>SMTP not configured</strong> — Edit <code>backend/email_config.php</code> with your SMTP credentials to enable email sending.</div>`;
    }

    function showResult(type, html) {
        if (!notifResult) return;
        notifResult.style.display = 'block';
        notifResult.className = 'notif-result ' + type;
        notifResult.innerHTML = html;
    }
});

// ── Toast Notification ────────────────────────────────
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon} fa-lg"></i>
        <div class="toast-content">
            <strong>${title}</strong>
            <p>${message}</p>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ── Logout ────────────────────────────────────────────
function logout() {
    fetch("../../backend/logout.php").then(() => { window.location = "../../index.html"; });
}
