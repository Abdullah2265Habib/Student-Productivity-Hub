/* ============================================
   calendar.js  –  Student Productivity Hub
   ============================================ */

const API = '../../backend';

/* ── State ─────────────────────────────────── */
let allGoals = [];
let currentMonth = new Date();
let selectedDate = null;

/* ── DOM Refs ──────────────────────────────── */
const monthYear = document.getElementById('monthYear');
const calendarGrid = document.getElementById('calendarGrid');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');

const sidebar = document.querySelector('.sidebar');
const sidebarTitle = document.getElementById('sidebarTitle');
const sidebarContent = document.getElementById('sidebarContent');
const closeSidebarBtn = document.getElementById('closeSidebar');

const goalModalOverlay = document.getElementById('goalModalOverlay');
const closeModalBtn = document.getElementById('closeModal');
const goalModalTitle = document.getElementById('goalModalTitle');
const goalModalBody = document.getElementById('goalModalBody');
const editGoalBtn = document.getElementById('editGoalBtn');
const viewGoalsPageBtn = document.getElementById('viewGoalsPageBtn');

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    loadGoals();
    bindEvents();
    renderCalendar();
});

/* ── Event Binding ──────────────────────────── */
function bindEvents() {
    prevMonthBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderCalendar();
    });

    todayBtn.addEventListener('click', () => {
        currentMonth = new Date();
        renderCalendar();
    });

    closeSidebarBtn.addEventListener('click', closeSidebar);
    closeModalBtn.addEventListener('click', () => closeModal(goalModalOverlay));

    goalModalOverlay.addEventListener('click', (e) => {
        if (e.target === goalModalOverlay) closeModal(goalModalOverlay);
    });

    editGoalBtn.addEventListener('click', () => {
        window.location = 'goals.html';
    });

    viewGoalsPageBtn.addEventListener('click', () => {
        window.location = 'goals.html';
    });
}

/* ══════════════════════════════════════════════
   LOAD GOALS
   ══════════════════════════════════════════════ */
function loadGoals() {
    fetch(`${API}/get_goals.php`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.goals) {
                allGoals = data.goals;
                renderCalendar();
            }
        })
        .catch(err => console.error('Error loading goals:', err));
}

/* ══════════════════════════════════════════════
   RENDER CALENDAR
   ══════════════════════════════════════════════ */
function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    monthYear.textContent = monthNames[month] + ' ' + year;

    // Get first day and days in month
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    calendarGrid.innerHTML = '';

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const cell = createCalendarDay(day, month - 1, year, true);
        calendarGrid.appendChild(cell);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = createCalendarDay(day, month, year, false);
        calendarGrid.appendChild(cell);
    }

    // Next month days
    const totalCells = calendarGrid.children.length;
    const remainingCells = 42 - totalCells; // 6 weeks * 7 days
    for (let day = 1; day <= remainingCells; day++) {
        const cell = createCalendarDay(day, month + 1, year, true);
        calendarGrid.appendChild(cell);
    }
}

/* ── Create Calendar Day ─────────────────────– */
function createCalendarDay(day, month, year, isOtherMonth) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day';

    if (isOtherMonth) {
        cell.classList.add('other-month');
        cell.textContent = day;
        return cell;
    }

    // Check if today
    const today = new Date();
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    if (isToday) {
        cell.classList.add('today');
    }

    // Get goals for this date
    const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    const goalsOnDate = allGoals.filter(goal => goal.target_date === dateStr);

    // Create day content
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    cell.appendChild(dayNumber);

    if (goalsOnDate.length > 0) {
        cell.classList.add('has-goals');
        
        if (goalsOnDate.length > 1) {
            cell.classList.add('multiple-goals');
        }

        // Add goal indicators
        const indicators = document.createElement('div');
        indicators.className = 'goal-indicators';
        
        goalsOnDate.slice(0, 3).forEach(goal => {
            const dot = document.createElement('div');
            dot.className = 'goal-dot';
            dot.style.backgroundColor = getPriorityColor(goal.priority);
            dot.title = goal.goal_text;
            indicators.appendChild(dot);
        });

        if (goalsOnDate.length > 3) {
            const more = document.createElement('div');
            more.className = 'goal-more';
            more.textContent = '+' + (goalsOnDate.length - 3);
            indicators.appendChild(more);
        }

        cell.appendChild(indicators);

        // Click handler
        cell.addEventListener('click', () => {
            selectedDate = dateStr;
            showGoalsForDate(dateStr, goalsOnDate, day, monthNames[month]);
        });
    } else {
        cell.classList.add('no-goals');
    }

    return cell;
}

/* ══════════════════════════════════════════════
   SHOW GOALS FOR DATE
   ══════════════════════════════════════════════ */
function showGoalsForDate(dateStr, goals, day, monthName) {
    selectedDate = dateStr;

    // Update sidebar
    sidebarTitle.textContent = monthName + ' ' + day;
    
    if (goals.length === 0) {
        sidebarContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>No goals on this date</p>
            </div>
        `;
    } else {
        sidebarContent.innerHTML = goals.map(goal => createGoalSummary(goal)).join('');
        
        // Add click handlers to summary cards
        document.querySelectorAll('.goal-summary').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.goal-summary')) {
                    const goalId = card.dataset.goalId;
                    showGoalDetail(parseInt(goalId));
                }
            });
        });
    }

    // Show sidebar on mobile
    sidebar.classList.add('open');
}

/* ── Create Goal Summary ─────────────────────– */
function createGoalSummary(goal) {
    const statusClass = goal.status === 'completed' ? 'completed' :
                       goal.status === 'in_progress' ? 'in_progress' : 'pending';
    
    const priorityClass = goal.priority === 'high' ? 'high' :
                         goal.priority === 'medium' ? 'medium' : 'low';

    const today = new Date();
    const goalDate = new Date(goal.target_date);
    const isOverdue = goalDate < today && goal.status !== 'completed';

    return `
        <div class="goal-summary" data-goal-id="${goal.id}">
            <div class="goal-summary-header">
                <h4>${escapeHtml(goal.goal_text)}</h4>
                <span class="priority-badge priority-${priorityClass}">${goal.priority}</span>
            </div>
            <div class="goal-summary-meta">
                <span class="status-badge status-${statusClass}">${formatStatus(goal.status)}</span>
                ${isOverdue ? '<span class="overdue-badge">Overdue</span>' : ''}
            </div>
        </div>
    `;
}

/* ══════════════════════════════════════════════
   SHOW GOAL DETAIL
   ══════════════════════════════════════════════ */
function showGoalDetail(goalId) {
    const goal = allGoals.find(g => g.id === goalId);
    if (!goal) return;

    const goalDate = new Date(goal.target_date);
    const dateStr = goalDate.toLocaleDateString('en-US', 
        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const today = new Date();
    const isOverdue = goalDate < today && goal.status !== 'completed';
    const daysLeft = Math.ceil((goalDate - today) / (1000 * 60 * 60 * 24));

    goalModalTitle.textContent = escapeHtml(goal.goal_text);
    goalModalBody.innerHTML = `
        <div class="goal-detail">
            <div class="detail-section">
                <h4>Status</h4>
                <span class="status-badge status-${goal.status}">${formatStatus(goal.status)}</span>
            </div>

            <div class="detail-section">
                <h4>Priority</h4>
                <span class="priority-badge priority-${goal.priority}">${goal.priority.toUpperCase()}</span>
            </div>

            <div class="detail-section">
                <h4>Target Date</h4>
                <div class="date-info">
                    <p>${dateStr}</p>
                    ${isOverdue ? 
                        `<p class="text-danger"><i class="fas fa-exclamation-circle"></i> Overdue</p>` :
                        `<p class="text-info"><i class="fas fa-clock"></i> ${daysLeft} days left</p>`
                    }
                </div>
            </div>

            <div class="detail-section">
                <h4>Timeline</h4>
                <div class="timeline">
                    <div class="timeline-item">
                        <span class="timeline-label">Created</span>
                        <span class="timeline-date">${new Date(goal.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="timeline-item active">
                        <span class="timeline-label">Target</span>
                        <span class="timeline-date">${goal.target_date}</span>
                    </div>
                    <div class="timeline-item">
                        <span class="timeline-label">Last Updated</span>
                        <span class="timeline-date">${new Date(goal.updated_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    openModal(goalModalOverlay);
}

/* ══════════════════════════════════════════════
   HELPER FUNCTIONS
   ══════════════════════════════════════════════ */
function formatStatus(status) {
    const map = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed'
    };
    return map[status] || status;
}

function getPriorityColor(priority) {
    const colors = {
        'high': '#ef4444',
        'medium': '#f59e0b',
        'low': '#10b981'
    };
    return colors[priority] || '#6366f1';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function closeSidebar() {
    sidebar.classList.remove('open');
}

function openModal(modal) {
    modal.style.display = 'flex';
}

function closeModal(modal) {
    modal.style.display = 'none';
}

function logout() {
    fetch(`${API}/logout.php`, { credentials: 'include' })
        .then(() => { window.location = '../../index.html'; });
}
