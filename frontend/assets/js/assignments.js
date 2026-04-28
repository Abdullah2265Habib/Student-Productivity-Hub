// assignments.js
let currentEditingId = null;
let currentDeleteId = null;
let allAssignments = [];
let filteredAssignments = [];
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAssignments();
    setMinDate();
});

// Set minimum date to today
function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dueDate').setAttribute('min', today);
}

// Load assignments from backend
async function loadAssignments() {
    try {
        const response = await fetch('../../backend/get_assignments.php');
        const data = await response.json();

        if (data.success) {
            allAssignments = data.assignments;
            applyFilter('all');
            renderAssignments();
        } else {
            showMessage('Error loading assignments', 'error');
        }
    } catch (error) {
        console.error('Error loading assignments:', error);
        showMessage('Failed to load assignments', 'error');
    }
}

// Apply filter to assignments
function applyFilter(filter) {
    currentFilter = filter;
    if (filter === 'all') {
        filteredAssignments = allAssignments;
    } else {
        filteredAssignments = allAssignments.filter(a => a.status === filter);
    }
}

// Filter assignments
function filterAssignments(filter) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    applyFilter(filter);
    renderAssignments();
}

// Render assignments in table and cards
function renderAssignments() {
    renderTable();
    renderCards();
}

// Render table view
function renderTable() {
    const tbody = document.getElementById('assignmentsTableBody');
    
    if (filteredAssignments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-message">No assignments found</td></tr>';
        return;
    }

    tbody.innerHTML = filteredAssignments.map(assignment => `
        <tr>
            <td>${escapeHtml(assignment.course_name)}</td>
            <td>${formatDate(assignment.due_date)}</td>
            <td>
                <span class="status-badge status-${assignment.status}">
                    ${formatStatus(assignment.status)}
                </span>
            </td>
            <td class="action-cell">
                <button class="action-icon edit-btn" onclick="openEditModal(${assignment.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-icon delete-btn" onclick="openDeleteModal(${assignment.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Render card view for mobile
function renderCards() {
    const cardsContainer = document.getElementById('assignmentsCards');
    
    if (filteredAssignments.length === 0) {
        cardsContainer.innerHTML = '<div class="empty-message">No assignments found</div>';
        return;
    }

    cardsContainer.innerHTML = filteredAssignments.map(assignment => `
        <div class="assignment-card">
            <div class="card-header">
                <h4>${escapeHtml(assignment.course_name)}</h4>
                <span class="status-badge status-${assignment.status}">
                    ${formatStatus(assignment.status)}
                </span>
            </div>
            <div class="card-body">
                <p><strong>Due:</strong> ${formatDate(assignment.due_date)}</p>
            </div>
            <div class="card-footer">
                <button class="btn-small edit-btn" onclick="openEditModal(${assignment.id})">Edit</button>
                <button class="btn-small delete-btn" onclick="openDeleteModal(${assignment.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Format status text
function formatStatus(status) {
    const statusMap = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'submitted': 'Submitted',
        'due_soon': 'Due Soon',
        'late': 'Late',
        'missed': 'Missed'
    };
    return statusMap[status] || status;
}

// Open add modal
function openAddModal() {
    currentEditingId = null;
    document.getElementById('modalTitle').textContent = 'Add Assignment';
    document.getElementById('assignmentForm').reset();
    document.getElementById('status').value = 'pending';
    document.getElementById('assignmentModal').classList.add('active');
}

// Open edit modal
function openEditModal(id) {
    const assignment = allAssignments.find(a => a.id == id);
    if (!assignment) return;

    currentEditingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Assignment';
    document.getElementById('courseName').value = assignment.course_name;
    document.getElementById('dueDate').value = assignment.due_date;
    document.getElementById('status').value = assignment.status;
    document.getElementById('assignmentModal').classList.add('active');
}

// Close modal
function closeModal() {
    currentEditingId = null;
    document.getElementById('assignmentModal').classList.remove('active');
    document.getElementById('assignmentForm').reset();
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();

    const courseName = document.getElementById('courseName').value.trim();
    const dueDate = document.getElementById('dueDate').value;
    const status = document.getElementById('status').value;

    if (!courseName || !dueDate) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    try {
        let endpoint, method, body;

        if (currentEditingId) {
            // Update
            endpoint = '../../backend/update_assignment.php';
            body = {
                id: currentEditingId,
                course_name: courseName,
                due_date: dueDate,
                status: status
            };
        } else {
            // Add
            endpoint = '../../backend/add_assignment.php';
            body = {
                course_name: courseName,
                due_date: dueDate,
                status: status
            };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (data.success) {
            showMessage(data.message, 'success');
            closeModal();
            loadAssignments();
        } else {
            showMessage(data.message || 'Error saving assignment', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Failed to save assignment', 'error');
    }
}

// Open delete confirmation modal
function openDeleteModal(id) {
    currentDeleteId = id;
    document.getElementById('deleteModal').classList.add('active');
}

// Close delete modal
function closeDeleteModal() {
    currentDeleteId = null;
    document.getElementById('deleteModal').classList.remove('active');
}

// Confirm delete
async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
        const response = await fetch('../../backend/delete_assignment.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: currentDeleteId })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('Assignment deleted successfully', 'success');
            closeDeleteModal();
            loadAssignments();
        } else {
            showMessage(data.message || 'Error deleting assignment', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Failed to delete assignment', 'error');
    }
}

// Show message notification
function showMessage(message, type = 'info') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(messageEl);

    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => messageEl.remove(), 300);
    }, 3000);
}

// Escape HTML special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Logout function
function logout() {
    fetch("../../backend/logout.php")
        .then(() => {
            window.location = "../../index.html";
        })
        .catch(error => console.error('Logout error:', error));
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
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
document.head.appendChild(style);
