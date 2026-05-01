/* ============================================
   goals.js  –  Student Productivity Hub
   ============================================ */

const API = '../../backend';

/* ── State ─────────────────────────────────── */
let allGoals      = [];
let goalsLoaded   = false;
let activeFilter  = 'all';
let activePriority = '';
let currentGoalId = null;

/* ── DOM Refs ──────────────────────────────── */
const goalsGrid        = document.getElementById('goalsGrid');
const searchInput      = document.getElementById('searchInput');
const addGoalBtn       = document.getElementById('addGoalBtn');
const loadGoalsBtn     = document.getElementById('loadGoalsBtn');
const goalsSection     = document.getElementById('goalsSection');

const goalModalOverlay = document.getElementById('goalModalOverlay');
const goalForm         = document.getElementById('goalForm');
const goalId           = document.getElementById('goalId');
const goalText         = document.getElementById('goalText');
const targetDate       = document.getElementById('targetDate');
const priority         = document.getElementById('priority');
const status           = document.getElementById('status');
const statusGroup      = document.getElementById('statusGroup');
const modalTitle       = document.getElementById('modalTitle');
const closeGoalModal   = document.getElementById('closeGoalModal');
const goalFormCancel   = document.getElementById('goalFormCancel');

const goalDetailOverlay = document.getElementById('goalDetailOverlay');
const goalDetailContent = document.getElementById('goalDetailContent');
const closeDetailModal  = document.getElementById('closeDetailModal');
const editGoalBtn       = document.getElementById('editGoalBtn');
const changeStatusBtn   = document.getElementById('changeStatusBtn');
const deleteGoalBtn     = document.getElementById('deleteGoalBtn');

const filterTabs       = document.querySelectorAll('.filter-tab');
const priorityFilter   = document.getElementById('priorityFilter');

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
});

/* ── Event Binding ──────────────────────────── */
function bindEvents() {
    addGoalBtn.addEventListener('click', () => openGoalModal(null));
    loadGoalsBtn.addEventListener('click', loadGoals);
    closeGoalModal.addEventListener('click', () => closeModal(goalModalOverlay));
    goalFormCancel.addEventListener('click', () => closeModal(goalModalOverlay));
    goalForm.addEventListener('submit', handleSubmitGoal);

    closeDetailModal.addEventListener('click', () => closeModal(goalDetailOverlay));
    editGoalBtn.addEventListener('click', handleEditGoal);
    changeStatusBtn.addEventListener('click', handleChangeStatus);
    deleteGoalBtn.addEventListener('click', handleDeleteGoal);

    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeFilter = tab.dataset.filter;
            renderGoals();
        });
    });

    priorityFilter.addEventListener('change', (e) => {
        activePriority = e.target.value;
        renderGoals();
    });

    searchInput.addEventListener('input', renderGoals);

    // Close modals when clicking overlay
    goalModalOverlay.addEventListener('click', (e) => {
        if (e.target === goalModalOverlay) closeModal(goalModalOverlay);
    });
    goalDetailOverlay.addEventListener('click', (e) => {
        if (e.target === goalDetailOverlay) closeModal(goalDetailOverlay);
    });
}

/* ══════════════════════════════════════════════
   LOAD GOALS
   ══════════════════════════════════════════════ */
function loadGoals() {
    if (goalsLoaded) {
        goalsSection.style.display = 'block';
        return;
    }

    goalsGrid.innerHTML = '<div class="loading">Loading goals...</div>';
    goalsSection.style.display = 'block';

    fetch(`${API}/get_goals.php`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                allGoals = data.goals || [];
                goalsLoaded = true;
                renderGoals();
            } else {
                showError(data.message || 'Failed to load goals');
            }
        })
        .catch(err => {
            showError('Error loading goals: ' + err.message);
            console.error(err);
        });
}

/* ══════════════════════════════════════════════
   RENDER GOALS
   ══════════════════════════════════════════════ */
function renderGoals() {
    const searchTerm = searchInput.value.toLowerCase();

    let filtered = allGoals.filter(goal => {
        const matchesSearch = goal.goal_text.toLowerCase().includes(searchTerm);
        const matchesFilter = activeFilter === 'all' || goal.status === activeFilter;
        const matchesPriority = activePriority === '' || goal.priority === activePriority;
        return matchesSearch && matchesFilter && matchesPriority;
    });

    if (filtered.length === 0) {
        goalsGrid.innerHTML = '<div class="empty-state">No goals found. Create one to get started!</div>';
        return;
    }

    goalsGrid.innerHTML = filtered.map(goal => createGoalCard(goal)).join('');
    goalsGrid.querySelectorAll('.goal-card').forEach(card => {
        card.addEventListener('click', () => {
            currentGoalId = card.dataset.goalId;
            showGoalDetail(parseInt(currentGoalId));
        });
    });
}

/* ── Create Goal Card ──────────────────────── */
function createGoalCard(goal) {
    const priorityClass = goal.priority === 'high' ? 'priority-high' : 
                         goal.priority === 'medium' ? 'priority-medium' : 'priority-low';
    
    const statusClass = goal.status === 'completed' ? 'status-completed' :
                       goal.status === 'in_progress' ? 'status-progress' : 'status-pending';

    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const isOverdue = targetDate < today && goal.status !== 'completed';

    const dateStr = targetDate.toLocaleDateString('en-US', 
        { month: 'short', day: 'numeric', year: targetDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });

    return `
        <div class="goal-card ${statusClass}" data-goal-id="${goal.id}">
            <div class="goal-header">
                <span class="priority-badge ${priorityClass}">${goal.priority}</span>
                <span class="status-badge ${statusClass}">${formatStatus(goal.status)}</span>
            </div>
            <div class="goal-body">
                <h3>${escapeHtml(goal.goal_text)}</h3>
                <div class="goal-meta">
                    <span class="meta-item">
                        <i class="fas fa-calendar"></i>
                        ${dateStr}
                        ${isOverdue ? '<span class="overdue-label">Overdue</span>' : ''}
                    </span>
                </div>
            </div>
        </div>
    `;
}

/* ── Format Status ─────────────────────────── */
function formatStatus(status) {
    const map = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed'
    };
    return map[status] || status;
}

/* ══════════════════════════════════════════════
   GOAL MODAL OPERATIONS
   ══════════════════════════════════════════════ */
function openGoalModal(goalObj) {
    statusGroup.style.display = 'none';
    goalForm.reset();
    goalId.value = '';

    if (goalObj) {
        // Edit mode
        modalTitle.textContent = 'Edit Goal';
        goalId.value = goalObj.id;
        goalText.value = goalObj.goal_text;
        targetDate.value = goalObj.target_date;
        priority.value = goalObj.priority;
        statusGroup.style.display = 'block';
        status.value = goalObj.status;
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Goal';
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDate.value = tomorrow.toISOString().split('T')[0];
    }

    openModal(goalModalOverlay);
}

function handleSubmitGoal(e) {
    e.preventDefault();

    const data = new FormData();
    data.append('goal_text', goalText.value);
    data.append('target_date', targetDate.value);
    data.append('priority', priority.value);
    if (goalId.value) {
        data.append('goal_id', goalId.value);
        data.append('status', status.value);
    }

    const endpoint = goalId.value ? 'update_goal.php' : 'add_goal.php';

    fetch(`${API}/${endpoint}`, {
        method: 'POST',
        body: data,
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showSuccess(data.message);
            closeModal(goalModalOverlay);
            goalsLoaded = false;
            loadGoals();
        } else {
            showError(data.message || 'Failed to save goal');
        }
    })
    .catch(err => {
        showError('Error saving goal: ' + err.message);
        console.error(err);
    });
}

/* ══════════════════════════════════════════════
   GOAL DETAIL MODAL
   ══════════════════════════════════════════════ */
function showGoalDetail(goalId) {
    const goal = allGoals.find(g => g.id === goalId);
    if (!goal) return;

    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const isOverdue = targetDate < today && goal.status !== 'completed';

    const dateStr = targetDate.toLocaleDateString('en-US', 
        { month: 'long', day: 'numeric', year: 'numeric' });

    goalDetailContent.innerHTML = `
        <div class="detail-section">
            <h3>${escapeHtml(goal.goal_text)}</h3>
            <div class="detail-badges">
                <span class="detail-badge priority-${goal.priority}">Priority: ${goal.priority.toUpperCase()}</span>
                <span class="detail-badge status-${goal.status}">Status: ${formatStatus(goal.status)}</span>
                ${isOverdue ? '<span class="detail-badge overdue">Overdue</span>' : ''}
            </div>
        </div>

        <div class="detail-info">
            <div class="info-row">
                <span class="info-label">Target Date:</span>
                <span class="info-value">${dateStr}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Created:</span>
                <span class="info-value">${new Date(goal.created_at).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Last Updated:</span>
                <span class="info-value">${new Date(goal.updated_at).toLocaleDateString()}</span>
            </div>
        </div>
    `;

    currentGoalId = goalId;
    openModal(goalDetailOverlay);
}

function handleEditGoal() {
    const goal = allGoals.find(g => g.id === currentGoalId);
    if (goal) {
        closeModal(goalDetailOverlay);
        openGoalModal(goal);
    }
}

function handleChangeStatus() {
    const goal = allGoals.find(g => g.id === currentGoalId);
    if (!goal) return;

    const statuses = ['pending', 'in_progress', 'completed'];
    const currentIdx = statuses.indexOf(goal.status);
    const newStatus = statuses[(currentIdx + 1) % statuses.length];

    const data = new FormData();
    data.append('goal_id', goal.id);
    data.append('status', newStatus);

    fetch(`${API}/update_goal.php`, {
        method: 'POST',
        body: data,
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showSuccess('Goal status updated');
            closeModal(goalDetailOverlay);
            goalsLoaded = false;
            loadGoals();
        } else {
            showError(data.message || 'Failed to update goal');
        }
    })
    .catch(err => showError('Error: ' + err.message));
}

function handleDeleteGoal() {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    const data = new FormData();
    data.append('goal_id', currentGoalId);

    fetch(`${API}/delete_goal.php`, {
        method: 'POST',
        body: data,
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showSuccess('Goal deleted');
            closeModal(goalDetailOverlay);
            goalsLoaded = false;
            loadGoals();
        } else {
            showError(data.message || 'Failed to delete goal');
        }
    })
    .catch(err => showError('Error: ' + err.message));
}

/* ══════════════════════════════════════════════
   MODAL HELPERS
   ══════════════════════════════════════════════ */
function openModal(modal) {
    modal.style.display = 'flex';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

/* ══════════════════════════════════════════════
   NOTIFICATIONS
   ══════════════════════════════════════════════ */
function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => div.remove(), 4000);
}

/* ── HTML Escape ────────────────────────────── */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ── Logout ────────────────────────────────── */
function logout() {
    fetch(`${API}/logout.php`, { credentials: 'include' })
        .then(() => { window.location = '../../index.html'; });
}
