/* ============================================================
   timer.js — StudyHub Pomodoro Timer
   - Focus / Short Break / Long Break modes
   - SVG ring animation with rotating dot
   - Auto-break after focus session completes
   - Saves every completed focus session to backend
   - Loads stats & recent sessions on page load
   ============================================================ */

'use strict';

/* ── Constants ───────────────────────────────────────────── */
const API          = '../../backend/timer.php';
const RING_CIRCUM  = 779.2;    /* 2π × 124  (matches SVG r="124") */
const RING_CX      = 130;
const RING_CY      = 130;
const RING_R       = 124;

const MODE_CONFIG = {
    'focus':       { label: 'Focus Session',   defaultMin: 25 },
    'short-break': { label: 'Short Break',      defaultMin: 5  },
    'long-break':  { label: 'Long Break',       defaultMin: 15 },
};

/* ── State ───────────────────────────────────────────────── */
let currentMode    = 'focus';
let totalSeconds   = 25 * 60;
let remainSeconds  = 25 * 60;
let isRunning      = false;
let intervalId     = null;
let sessionStart   = null;     /* Date object when current focus run started */
let pomodoroCount  = 0;        /* completed focus sessions this page load */
let selectedPreset = 25;       /* minutes – focus preset */
let dotAngleDeg    = 0;        /* current dot angle for smooth animation */

/* ── DOM refs ────────────────────────────────────────────── */
const timerDisplay   = document.getElementById('timerDisplay');
const modeLabel      = document.getElementById('modeLabel');
const ringProgress   = document.getElementById('ringProgress');
const ringDot        = document.getElementById('ringDot');
const ringContainer  = document.getElementById('ringContainer');
const btnPlayPause   = document.getElementById('btnPlayPause');
const playIcon       = document.getElementById('playIcon');
const durationPresets= document.getElementById('durationPresets');
const breakBarWrap   = document.getElementById('breakBarWrap');
const breakBarFill   = document.getElementById('breakBarFill');
const sessionLog     = document.getElementById('sessionLog');
const statToday      = document.getElementById('statToday');
const statSessions   = document.getElementById('statSessions');
const statTotal      = document.getElementById('statTotal');
const statStreak     = document.getElementById('statStreak');

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    renderTimer();
    positionDot(0);            /* dot at 12 o'clock */
    updatePlayButton();
    document.title = '25:00 — Focus | StudyHub';
});

/* ── Keyboard shortcut: Space to play/pause ─────────────── */
document.addEventListener('keydown', e => {
    if (e.code === 'Space' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        toggleTimer();
    }
    if (e.code === 'KeyR' && !e.ctrlKey) resetTimer();
});

/* ════════════════════════════════════════════════════════════
   CORE TIMER
   ════════════════════════════════════════════════════════════ */

/** Toggle play / pause */
function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (remainSeconds <= 0) return;
    isRunning = true;

    if (currentMode === 'focus' && !sessionStart) {
        sessionStart = new Date();
    }

    intervalId = setInterval(tick, 1000);
    updatePlayButton();
    updateRingRunningState();
    btnPlayPause.classList.add('pulsing');
}

function pauseTimer() {
    isRunning = false;
    clearInterval(intervalId);
    intervalId = null;
    updatePlayButton();
    updateRingRunningState();
    btnPlayPause.classList.remove('pulsing');
}

function tick() {
    if (remainSeconds > 0) {
        remainSeconds--;
        renderTimer();
        animateRing();
        updatePageTitle();
    } else {
        sessionComplete();
    }
}

function resetTimer() {
    pauseTimer();
    sessionStart  = null;
    remainSeconds = totalSeconds;
    renderTimer();
    animateRing();
    positionDot(0);
    updatePageTitle();
    updateRingRunningState();
}

/** Called when a timer reaches 0 */
function sessionComplete() {
    pauseTimer();
    btnPlayPause.classList.remove('pulsing');

    if (currentMode === 'focus') {
        pomodoroCount++;
        statStreak.textContent = pomodoroCount;

        const elapsed    = totalSeconds - remainSeconds;    /* should be totalSeconds */
        const endTime    = new Date();
        const startTime  = sessionStart || new Date(endTime.getTime() - elapsed * 1000);
        saveSession(elapsed, startTime, endTime);

        sessionStart = null;
        playChime();

        /* Auto-switch to break */
        const breakMode = (pomodoroCount % 4 === 0) ? 'long-break' : 'short-break';
        setTimeout(() => switchMode(breakMode, true), 800);
    } else {
        /* Break finished → switch back to focus */
        playChime();
        setTimeout(() => switchMode('focus', false), 800);
    }
}

/** Skip current session without saving */
function skipSession() {
    pauseTimer();
    sessionStart = null;
    if (currentMode === 'focus') {
        const breakMode = (pomodoroCount % 4 === 0) ? 'long-break' : 'short-break';
        switchMode(breakMode, true);
    } else {
        switchMode('focus', false);
    }
}

/* ════════════════════════════════════════════════════════════
   MODE SWITCHING
   ════════════════════════════════════════════════════════════ */
function switchMode(mode, autoStart = false) {
    pauseTimer();
    sessionStart  = null;
    currentMode   = mode;

    /* Duration */
    if (mode === 'focus') {
        totalSeconds = selectedPreset * 60;
    } else {
        totalSeconds = MODE_CONFIG[mode].defaultMin * 60;
    }
    remainSeconds = totalSeconds;

    /* Update tab UI */
    document.querySelectorAll('.mode-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.mode === mode);
    });

    /* Labels */
    modeLabel.textContent = MODE_CONFIG[mode].label;

    /* Ring colour class */
    ringProgress.classList.remove('idle-stroke', 'break-stroke');
    ringDot.classList.remove('idle-dot', 'break-dot');
    if (mode === 'focus') {
        ringProgress.classList.add('idle-stroke');
        ringDot.classList.add('idle-dot');
    } else {
        ringProgress.classList.add('break-stroke');
        ringDot.classList.add('break-dot');
    }

    /* Break bar */
    const isBreak = mode !== 'focus';
    breakBarWrap.classList.toggle('visible', isBreak);
    breakBarFill.style.width = '100%';

    /* Preset buttons visible only in focus */
    durationPresets.style.display = mode === 'focus' ? 'flex' : 'none';

    renderTimer();
    animateRing();
    positionDot(0);
    updatePlayButton();
    updateRingRunningState();
    updatePageTitle();

    if (autoStart) startTimer();
}

/* ════════════════════════════════════════════════════════════
   PRESETS
   ════════════════════════════════════════════════════════════ */
function setPreset(minutes, btn) {
    if (isRunning) return;   /* don't change mid-session */
    selectedPreset = minutes;
    totalSeconds   = minutes * 60;
    remainSeconds  = totalSeconds;

    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    renderTimer();
    animateRing();
    positionDot(0);
    updatePageTitle();
}

/* ════════════════════════════════════════════════════════════
   RENDERING
   ════════════════════════════════════════════════════════════ */
function renderTimer() {
    const m = Math.floor(remainSeconds / 60);
    const s = remainSeconds % 60;
    const str = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    timerDisplay.textContent = str;

    /* colour tint */
    timerDisplay.classList.remove('running-color','break-color');
    if (isRunning && currentMode === 'focus') timerDisplay.classList.add('running-color');
    if (currentMode !== 'focus')              timerDisplay.classList.add('break-color');
}

function animateRing() {
    const progress   = totalSeconds > 0 ? remainSeconds / totalSeconds : 0;
    const offset     = RING_CIRCUM * (1 - progress);
    ringProgress.style.strokeDashoffset = offset;

    /* Break bar */
    if (currentMode !== 'focus') {
        breakBarFill.style.width = (progress * 100) + '%';
    }

    /* Dot angle: 0° = 12 o'clock, progress from full circle backwards */
    const angleDeg = 360 * (1 - progress);
    positionDot(angleDeg);
}

/**
 * Place the dot along the ring circumference.
 * angle=0 → 12 o'clock (top), increases clockwise.
 */
function positionDot(angleDeg) {
    const rad  = (angleDeg - 90) * (Math.PI / 180);
    const x    = RING_CX + RING_R * Math.cos(rad);
    const y    = RING_CY + RING_R * Math.sin(rad);
    /* The ring SVG is 260×260; the container div is 260×260 (var(--ring-size)) */
    /* dot is 14px so offset by -7 to centre it */
    const pct  = 260;
    const left = (x / pct) * 100;
    const top  = (y / pct) * 100;
    ringDot.style.left      = `calc(${left}% - 7px)`;
    ringDot.style.top       = `calc(${top}%  - 7px)`;
    ringDot.style.transform = 'none';
}

function updatePlayButton() {
    playIcon.className = isRunning ? 'fas fa-pause' : 'fas fa-play';
    btnPlayPause.classList.remove('break-btn', 'pulsing');
    if (currentMode !== 'focus') {
        btnPlayPause.classList.add('break-btn');
    }
}

function updateRingRunningState() {
    ringContainer.classList.remove('running', 'break-mode');
    if (isRunning && currentMode === 'focus')    ringContainer.classList.add('running');
    if (isRunning && currentMode !== 'focus')    ringContainer.classList.add('break-mode');
}

function updatePageTitle() {
    const m = Math.floor(remainSeconds / 60);
    const s = remainSeconds % 60;
    const emoji = currentMode === 'focus' ? '🍅' : '☕';
    document.title = `${emoji} ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} — StudyHub`;
}

/* ════════════════════════════════════════════════════════════
   BACKEND — SAVE SESSION
   ════════════════════════════════════════════════════════════ */
async function saveSession(durationSeconds, startTime, endTime) {
    const payload = {
        action:              'save',
        session_duration:    durationSeconds,
        session_start_time:  formatDatetime(startTime),
        session_end_time:    formatDatetime(endTime),
    };

    try {
        const res  = await fetch(API + '?action=save', {
            method:      'POST',
            credentials: 'include',
            headers:     { 'Content-Type': 'application/json' },
            body:        JSON.stringify(payload),
        });
        const data = await res.json();

        if (data.success) {
            showToast(`Session saved — ${fmtSeconds(durationSeconds)}`, 'success');
            loadStats();          /* refresh sidebar stats */
        } else {
            showToast('Could not save session: ' + (data.message || ''), 'error');
        }
    } catch (err) {
        showToast('Network error saving session.', 'error');
        console.error('saveSession error:', err);
    }
}

/* ════════════════════════════════════════════════════════════
   BACKEND — LOAD STATS
   ════════════════════════════════════════════════════════════ */
async function loadStats() {
    try {
        const res  = await fetch(API + '?action=stats', { credentials: 'include' });
        const data = await res.json();

        if (!data.success) return;

        statToday.textContent    = fmtSeconds(data.today_seconds);
        statSessions.textContent = data.session_count;
        statTotal.textContent    = fmtHours(data.total_seconds);

        renderSessionLog(data.recent_sessions || []);
    } catch (err) {
        console.warn('loadStats error:', err);
    }
}

function renderSessionLog(sessions) {
    if (!sessions.length) {
        sessionLog.innerHTML = `
            <li class="session-empty">
                <i class="fas fa-clock"></i>
                No sessions yet. Start your first timer!
            </li>`;
        return;
    }

    sessionLog.innerHTML = sessions.map(s => {
        const dur  = fmtSeconds(s.session_duration);
        const when = fmtRelativeTime(s.date_logged);
        return `
        <li class="session-item">
            <div class="session-dot"></div>
            <div class="session-info">
                <div class="session-duration">${dur}</div>
                <div class="session-time">${when}</div>
            </div>
        </li>`;
    }).join('');
}

/* ════════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════════ */
function fmtSeconds(sec) {
    sec = parseInt(sec, 10) || 0;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function fmtHours(sec) {
    sec = parseInt(sec, 10) || 0;
    const h = (sec / 3600).toFixed(1);
    return h + 'h';
}

function fmtRelativeTime(ts) {
    if (!ts) return '';
    const date  = new Date(ts.replace(' ', 'T'));
    const diff  = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)      return 'just now';
    if (diff < 3600)    return Math.floor(diff/60) + 'm ago';
    if (diff < 86400)   return Math.floor(diff/3600) + 'h ago';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDatetime(date) {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function playChime() {
    try {
        const ctx  = new (window.AudioContext || window.webkitAudioContext)();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type            = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.85);
    } catch (_) { /* audio not available */ }
}

function showToast(message, type = 'success') {
    const t = document.createElement('div');
    t.className = `save-toast ${type}`;
    t.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.transition = 'opacity .3s ease';
        t.style.opacity    = '0';
        setTimeout(() => t.remove(), 320);
    }, 3500);
}

/* ── Logout ────────────────────────────────────────────────── */
function logout() {
    fetch('../../backend/logout.php', { credentials: 'include' })
        .then(() => window.location.href = '../../index.html');
}