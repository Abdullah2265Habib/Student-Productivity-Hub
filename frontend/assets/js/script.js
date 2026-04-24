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
