/* =====================================================
   Analytics Page — Chart.js powered analytics
   ===================================================== */

// ── Auth check ──────────────────────────────────────
fetch("../../backend/check_auth.php")
    .then(r => r.text())
    .then(r => { if (r === "unauthorized") window.location = "login.html?redirect=analytics.html"; });

// ── Chart.js defaults ───────────────────────────────
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.elements.bar.borderRadius = 6;
Chart.defaults.elements.line.tension = 0.4;

const COLORS = {
    blue:    '#2563eb', blueLight:   '#93c5fd', blueBg:    'rgba(37,99,235,.1)',
    green:   '#10b981', greenLight:  '#6ee7b7', greenBg:   'rgba(16,185,129,.1)',
    orange:  '#f59e0b', orangeLight: '#fcd34d', orangeBg:  'rgba(245,158,11,.1)',
    red:     '#ef4444', redLight:    '#fca5a5', redBg:     'rgba(239,68,68,.1)',
    violet:  '#8b5cf6', violetLight: '#c4b5fd', violetBg:  'rgba(139,92,246,.1)',
    cyan:    '#06b6d4', cyanLight:   '#67e8f9', cyanBg:    'rgba(6,182,212,.1)',
    gray:    '#94a3b8',
};

let chartInstances = {};

// ── Load user info ──────────────────────────────────
fetch("../../backend/get_user.php", { credentials: 'include' })
    .then(r => r.json())
    .then(d => {
        if (d.success && d.user) {
            const n = d.user.name || 'Student';
            document.getElementById("userName").textContent = n;
            document.getElementById("userAvatar").textContent = n.trim().charAt(0).toUpperCase();
        }
    }).catch(() => {});

// ── Fetch analytics data ────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    fetch("../../backend/analytics_stats.php", { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
            if (!data.success) return showError();
            renderKPIs(data);
            renderStreak(data.study.streak);
            renderProductivityScore(data);
            renderStudyChart(data.study);
            renderNotesChart(data.notes);
            renderAssignmentsChart(data.assignments);
            renderGoalsChart(data.goals);
            renderGoalsPriorityChart(data.goals);
            renderWeeklyChart(data.study);
            renderHeatmap(data.study.per_day);
            renderNotesTypeChart(data.notes);
        })
        .catch(err => {
            console.error("Analytics rendering error:", err);
            showError();
        });
});

function showError() {
    document.querySelectorAll('.chart-skeleton').forEach(el => {
        el.innerHTML = '<div class="empty-chart-state"><i class="fas fa-exclamation-triangle"></i><p>Could not load analytics data</p></div>';
        el.classList.remove('chart-skeleton');
    });
}

// ── KPI Cards ───────────────────────────────────────
function renderKPIs(data) {
    const fmt = s => { const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };

    document.getElementById('kpiNotes').textContent = data.notes.total;
    document.getElementById('kpiAssignments').textContent = data.assignments.total;
    document.getElementById('kpiGoals').textContent = data.goals.total;
    document.getElementById('kpiStudyTime').textContent = fmt(data.study.total_seconds);
    document.getElementById('kpiSessions').textContent = data.study.total_sessions;
    
    const kpiScore = document.getElementById('kpiScore');
    if (kpiScore) kpiScore.textContent = data.productivity_score + '%';

    // Trend badges
    const completed = data.goals.by_status?.completed || 0;
    const total = data.goals.total || 1;
    const pct = Math.round((completed / total) * 100);
    const trendEl = document.getElementById('kpiGoalsTrend');
    if (trendEl) {
        trendEl.className = 'kpi-trend ' + (pct >= 50 ? 'up' : pct > 0 ? 'neutral' : 'down');
        trendEl.innerHTML = `<i class="fas fa-${pct >= 50 ? 'arrow-up' : pct > 0 ? 'minus' : 'arrow-down'}"></i> ${pct}% done`;
    }
}

// ── Streak Banner ───────────────────────────────────
function renderStreak(streak) {
    document.getElementById('streakDays').textContent = streak;
    const msg = document.getElementById('streakMsg');
    if (streak === 0) msg.textContent = "Start studying today to begin your streak!";
    else if (streak < 3) msg.textContent = "Great start! Keep the momentum going.";
    else if (streak < 7) msg.textContent = "You're on fire! Almost a full week.";
    else msg.textContent = "Incredible dedication! You're unstoppable.";
}

// ── Productivity Score Ring ─────────────────────────
function renderProductivityScore(data) {
    const score = data.productivity_score;
    const ctx = document.getElementById('scoreRingCanvas');
    if (!ctx) return;

    const el = document.getElementById('scoreNum');
    if (el) el.textContent = score;

    chartInstances.score = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [
                    score >= 70 ? COLORS.green : score >= 40 ? COLORS.orange : COLORS.red,
                    '#f1f5f9'
                ],
                borderWidth: 0,
                cutout: '78%',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            animation: { animateRotate: true, duration: 1200 }
        }
    });

    // Breakdown bars
    const cGoals = data.goals.by_status?.completed || 0;
    const tGoals = data.goals.total || 1;
    const sAssign = data.assignments.by_status?.submitted || 0;
    const tAssign = data.assignments.total || 1;
    const studyHrs = data.study.total_seconds / 3600;

    setBarWidth('barGoals', (cGoals / tGoals) * 100);
    setBarWidth('barAssign', (sAssign / tAssign) * 100);
    setBarWidth('barStudy', Math.min(100, (studyHrs / 10) * 100));

    const gPct = document.getElementById('barGoalsLabel');
    if (gPct) gPct.textContent = `${cGoals}/${tGoals} completed`;
    const aPct = document.getElementById('barAssignLabel');
    if (aPct) aPct.textContent = `${sAssign}/${tAssign} submitted`;
    const sPct = document.getElementById('barStudyLabel');
    if (sPct) sPct.textContent = `${studyHrs.toFixed(1)}h of 10h target`;
}

function setBarWidth(id, pct) {
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.style.width = Math.min(100, pct) + '%', 300);
}

// ── Study Time (7-day bar chart) ────────────────────
function renderStudyChart(study) {
    const ctx = document.getElementById('studyDailyChart');
    if (!ctx) return;
    removeSkeleton(ctx);

    const days = getLast7Days();
    const dataMap = {};
    (study.per_day || []).forEach(d => { dataMap[d.day] = Math.round(d.seconds / 60); });
    const values = days.map(d => dataMap[d] || 0);

    chartInstances.studyDaily = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days.map(d => formatDayLabel(d)),
            datasets: [{
                label: 'Minutes Studied',
                data: values,
                backgroundColor: createGradient(ctx, COLORS.blue, COLORS.blueLight),
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.6,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: v => v + 'm' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ── Notes Per Month (line chart) ────────────────────
function renderNotesChart(notes) {
    const ctx = document.getElementById('notesMonthChart');
    if (!ctx) return;
    removeSkeleton(ctx);

    const months = getLast6Months();
    const dataMap = {};
    (notes.per_month || []).forEach(d => { dataMap[d.month] = parseInt(d.count); });
    const values = months.map(m => dataMap[m] || 0);

    chartInstances.notesMonth = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => formatMonthLabel(m)),
            datasets: [{
                label: 'Notes Created',
                data: values,
                borderColor: COLORS.violet,
                backgroundColor: COLORS.violetBg,
                fill: true,
                pointBackgroundColor: COLORS.violet,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ── Assignments by Status (doughnut) ────────────────
function renderAssignmentsChart(assignments) {
    const ctx = document.getElementById('assignStatusChart');
    if (!ctx) return;
    removeSkeleton(ctx);

    const statuses = assignments.by_status || {};
    const labels = Object.keys(statuses);
    const values = Object.values(statuses);

    if (labels.length === 0) {
        showEmpty(ctx, 'No assignment data yet', 'assignments.html');
        return;
    }

    const colorMap = { pending: COLORS.orange, in_progress: COLORS.blue, submitted: COLORS.green, missed: COLORS.red, late: COLORS.red };
    const bgColors = labels.map(l => colorMap[l] || COLORS.gray);

    chartInstances.assignStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(l => formatStatus(l)),
            datasets: [{ data: values, backgroundColor: bgColors, borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '60%',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ── Goals by Status (doughnut) ──────────────────────
function renderGoalsChart(goals) {
    const ctx = document.getElementById('goalsStatusChart');
    if (!ctx) return;
    removeSkeleton(ctx);

    const statuses = goals.by_status || {};
    const labels = Object.keys(statuses);
    const values = Object.values(statuses);

    if (labels.length === 0) {
        showEmpty(ctx, 'No goals data yet', 'goals.html');
        return;
    }

    const colorMap = { active: COLORS.blue, completed: COLORS.green, missed: COLORS.red, in_progress: COLORS.cyan, pending: COLORS.orange };
    const bgColors = labels.map(l => colorMap[l] || COLORS.gray);

    chartInstances.goalsStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(l => formatStatus(l)),
            datasets: [{ data: values, backgroundColor: bgColors, borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '60%',
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ── Goals by Priority (horizontal bar) ──────────────
function renderGoalsPriorityChart(goals) {
    const ctx = document.getElementById('goalsPriorityChart');
    if (!ctx) return;
    removeSkeleton(ctx);

    const priorities = goals.by_priority || {};
    const labels = Object.keys(priorities);
    const values = Object.values(priorities);

    if (labels.length === 0) { showEmpty(ctx, 'No goals data yet', 'goals.html'); return; }

    const colorMap = { high: COLORS.red, medium: COLORS.orange, low: COLORS.green };
    const bgColors = labels.map(l => colorMap[l] || COLORS.gray);

    chartInstances.goalsPriority = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
            datasets: [{ label: 'Goals', data: values, backgroundColor: bgColors, borderRadius: 8, barPercentage: 0.5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
                y: { grid: { display: false } }
            }
        }
    });
}

// ── Weekly Study Trend (area line) ──────────────────
function renderWeeklyChart(study) {
    const ctx = document.getElementById('weeklyStudyChart');
    if (!ctx) return;
    removeSkeleton(ctx);

    const weeks = study.per_week || [];
    if (weeks.length === 0) { showEmpty(ctx, 'No study sessions yet', 'timer.html'); return; }

    const labels = weeks.map(w => 'Week of ' + formatDayLabel(w.week_start));
    const hours = weeks.map(w => (parseInt(w.seconds) / 3600).toFixed(1));
    const sessions = weeks.map(w => parseInt(w.sessions));

    chartInstances.weeklyStudy = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Hours', data: hours, borderColor: COLORS.blue, backgroundColor: COLORS.blueBg, fill: true, yAxisID: 'y', pointRadius: 5, pointHoverRadius: 7 },
                { label: 'Sessions', data: sessions, borderColor: COLORS.green, backgroundColor: 'transparent', borderDash: [6, 3], yAxisID: 'y1', pointRadius: 4, pointStyle: 'rect' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y:  { beginAtZero: true, position: 'left', grid: { color: '#f1f5f9' }, title: { display: true, text: 'Hours' } },
                y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Sessions' }, ticks: { stepSize: 1 } },
                x:  { grid: { display: false } }
            }
        }
    });
}

// ── Activity Heatmap ────────────────────────────────
function renderHeatmap(perDay) {
    const grid = document.getElementById('heatmapGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const dataMap = {};
    (perDay || []).forEach(d => { dataMap[d.day] = parseInt(d.seconds); });

    const today = new Date();
    const cells = [];
    for (let i = 27; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const secs = dataMap[key] || 0;
        const mins = Math.round(secs / 60);
        let level = 0;
        if (mins > 0) level = 1;
        if (mins >= 30) level = 2;
        if (mins >= 60) level = 3;
        if (mins >= 120) level = 4;

        const cell = document.createElement('div');
        cell.className = `heatmap-cell level-${level}`;
        cell.title = `${formatDayLabel(key)}: ${mins}m studied`;
        grid.appendChild(cell);
    }
}

// ── Notes Type Split (pie) ──────────────────────────
function renderNotesTypeChart(notes) {
    const ctx = document.getElementById('notesTypeChart');
    if (!ctx) return;
    removeSkeleton(ctx);

    if (notes.total === 0) { showEmpty(ctx, 'No notes yet', 'notes.html'); return; }

    chartInstances.notesType = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Text Notes', 'PDF Notes'],
            datasets: [{ data: [notes.text, notes.pdf], backgroundColor: [COLORS.cyan, COLORS.orange], borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ── Helpers ──────────────────────────────────────────
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
    }
    return days;
}

function getLast6Months() {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    }
    return months;
}

function formatDayLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthLabel(monthStr) {
    const [y, m] = monthStr.split('-');
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function formatStatus(s) {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function createGradient(canvas, c1, c2) {
    const ctx2 = canvas.getContext('2d');
    const g = ctx2.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    return g;
}

function removeSkeleton(canvas) {
    const parent = canvas.closest('.chart-canvas-wrap');
    if (parent) parent.querySelector('.chart-skeleton')?.remove();
}

function showEmpty(canvas, msg, link) {
    const wrap = canvas.closest('.chart-canvas-wrap');
    if (wrap) {
        canvas.style.display = 'none';
        wrap.innerHTML += `<div class="empty-chart-state"><i class="fas fa-chart-pie"></i><p>${msg}</p><a href="${link}">Get started →</a></div>`;
    }
}

// ── Logout ──────────────────────────────────────────
function logout() {
    fetch("../../backend/logout.php").then(() => { window.location = "../../index.html"; });
}
