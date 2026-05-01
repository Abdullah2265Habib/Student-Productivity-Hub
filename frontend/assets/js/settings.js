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
        const name = document.getElementById('updateName').value.trim();
        const email = document.getElementById('updateEmail').value.trim();

        if (!name || !email) {
            showToast('error', 'Validation Error', 'Please fill in all fields.');
            return;
        }

        saveProfileBtn.disabled = true;
        saveProfileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const formData = new FormData();
        formData.append('action', 'update_profile');
        formData.append('name', name);
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
                document.getElementById('mainName').textContent = name;
                document.getElementById('mainEmail').textContent = email;
                document.getElementById('sidebarName').textContent = name;
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
