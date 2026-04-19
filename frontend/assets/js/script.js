/* ==========================================
   Modal Management Functions
   ========================================== */

function openLoginModal() {
    const modal = document.getElementById("loginModal");
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeLoginModal() {
    const modal = document.getElementById("loginModal");
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}

function openSignupModal() {
    const modal = document.getElementById("signupModal");
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeSignupModal() {
    const modal = document.getElementById("signupModal");
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}

/* ==========================================
   Scroll to Section Function
   ========================================== */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

/* ==========================================
   Modal Close on Outside Click
   ========================================== */
window.onclick = function(event) {
    const loginModal = document.getElementById("loginModal");
    const signupModal = document.getElementById("signupModal");

    if (event.target === loginModal) {
        loginModal.style.display = "none";
        document.body.style.overflow = "auto";
    }
    if (event.target === signupModal) {
        signupModal.style.display = "none";
        document.body.style.overflow = "auto";
    }
}

/* ==========================================
   Form Submission Handlers
   ========================================== */

// Login Form Handler
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        const rememberMe = document.getElementById("rememberMe").checked;
        
        // Validate inputs
        if (!email || !password) {
            showNotification("Please fill in all fields", "error");
            return;
        }

        // Simulate login (replace with actual API call)
        console.log("Login attempt:", {
            email: email,
            password: password,
            rememberMe: rememberMe
        });

        // Show success message
        showNotification("Login successful! Redirecting...", "success");
        
        // Reset form
        loginForm.reset();
        
        // Redirect after 1.5 seconds (replace with actual navigation)
        setTimeout(() => {
            // window.location.href = "/dashboard";
            closeLoginModal();
        }, 1500);
    });
}

// Signup Form Handler
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const firstName = document.getElementById("signupFirstName").value;
        const lastName = document.getElementById("signupLastName").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("signupConfirmPassword").value;
        const role = document.getElementById("signupRole").value;
        const agreeTerms = document.getElementById("agreeTerms").checked;
        
        // Validation
        if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
            showNotification("Please fill in all fields", "error");
            return;
        }

        if (password !== confirmPassword) {
            showNotification("Passwords do not match", "error");
            return;
        }

        if (password.length < 8) {
            showNotification("Password must be at least 8 characters", "error");
            return;
        }

        if (!agreeTerms) {
            showNotification("Please agree to the terms and conditions", "error");
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification("Please enter a valid email address", "error");
            return;
        }

        // Simulate signup (replace with actual API call)
        console.log("Signup attempt:", {
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: role
        });

        // Show success message
        showNotification("Account created successfully! Redirecting to login...", "success");
        
        // Reset form
        signupForm.reset();
        
        // Redirect after 2 seconds
        setTimeout(() => {
            closeSignupModal();
            openLoginModal();
        }, 2000);
    });
}

/* ==========================================
   Notification System
   ========================================== */

function showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles if not already in CSS
    const style = document.createElement("style");
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            z-index: 3000;
            animation: slideInRight 0.3s ease;
        }

        .notification-success {
            background-color: #10b981;
            color: white;
        }

        .notification-error {
            background-color: #ef4444;
            color: white;
        }

        .notification-info {
            background-color: #3b82f6;
            color: white;
        }

        .notification-warning {
            background-color: #f59e0b;
            color: white;
        }

        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    
    // Add styles to document if not already there
    if (!document.querySelector("style[data-notification]")) {
        style.setAttribute("data-notification", "true");
        document.head.appendChild(style);
    }
    
    // Add notification to page
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

/* ==========================================
   Keyboard Shortcuts
   ========================================== */

document.addEventListener("keydown", function(event) {
    // ESC key to close modals
    if (event.key === "Escape") {
        const loginModal = document.getElementById("loginModal");
        const signupModal = document.getElementById("signupModal");
        
        if (loginModal.style.display === "block") {
            closeLoginModal();
        }
        if (signupModal.style.display === "block") {
            closeSignupModal();
        }
    }
});

/* ==========================================
   Smooth Scroll for Navigation
   ========================================== */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Skip if it's a modal trigger
        if (href === "#" || href === "") {
            return;
        }
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

/* ==========================================
   Initialization
   ========================================== */

document.addEventListener("DOMContentLoaded", function() {
    console.log("StudyHub Dashboard Loaded");
    
    // Add any initialization code here
    // Example: Check if user is already logged in
    const isLoggedIn = localStorage.getItem("userLoggedIn");
    if (isLoggedIn) {
        console.log("User is logged in");
    }
});

/* ==========================================
   Utility Functions
   ========================================== */

// Store user data in localStorage (basic implementation)
function saveUserData(userData) {
    localStorage.setItem("userData", JSON.stringify(userData));
    localStorage.setItem("userLoggedIn", "true");
}

// Get user data from localStorage
function getUserData() {
    const data = localStorage.getItem("userData");
    return data ? JSON.parse(data) : null;
}

// Clear user data
function clearUserData() {
    localStorage.removeItem("userData");
    localStorage.removeItem("userLoggedIn");
}

// Logout function
function logout() {
    clearUserData();
    window.location.href = "/";
}
