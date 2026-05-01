fetch("../../backend/check_auth.php")
    .then(r => r.text())
    .then(t => { if (t.trim() === "unauthorized") window.location = "login.html"; });

const API = '../../backend';

let currentDate     = new Date();
let allGoals        = [];
let allHolidays     = [];
let selectedDateStr = null;

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    Promise.all([loadGoals(), loadHolidays()]).then(() => renderCalendar());
});

function bindEvents() {
    document.getElementById('prevBtn').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); });
    document.getElementById('nextBtn').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); });
    document.getElementById('todayBtn').addEventListener('click', () => { currentDate = new Date(); renderCalendar(); selectDate(toDateStr(new Date())); });
    document.getElementById('addHolidayBtn').addEventListener('click', () => openModal(null));
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelModal').addEventListener('click', closeModal);
    document.getElementById('saveHolidayBtn').addEventListener('click', saveHoliday);
    document.getElementById('holidayModal').addEventListener('click', e => { if (e.target === document.getElementById('holidayModal')) closeModal(); });
}

function loadGoals() {
    return fetch(`${API}/get_goals.php`, { credentials: 'include' })
        .then(r => r.json())
        .then(d => { if (d.success) allGoals = d.goals || []; })
        .catch(() => {});
}

function loadHolidays() {
    return fetch(`${API}/get_holidays.php`, { credentials: 'include' })
        .then(r => r.json())
        .then(d => { if (d.success) allHolidays = d.holidays || []; renderHolidaysOverview(); })
        .catch(() => { renderHolidaysOverview(); });
}

function buildMaps() {
    const goalMap = {}, holidayMap = {};
    allGoals.forEach(g => { (goalMap[g.target_date] = goalMap[g.target_date] || []).push(g); });
    allHolidays.forEach(h => { (holidayMap[h.date] = holidayMap[h.date] || []).push(h); });
    return { goalMap, holidayMap };
}

function renderCalendar() {
    const year = currentDate.getFullYear(), month = currentDate.getMonth();
    document.getElementById('monthLabel').textContent = MONTHS[month] + ' ' + year;

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays    = new Date(year, month, 0).getDate();
    const today       = toDateStr(new Date());
    const { goalMap, holidayMap } = buildMaps();
    const grid = document.getElementById('calGrid');
    grid.innerHTML = '';

    for (let i = firstDay-1; i >= 0; i--)
        grid.appendChild(buildDay(prevDays-i, month-1, year, true, goalMap, holidayMap, today));
    for (let d = 1; d <= daysInMonth; d++)
        grid.appendChild(buildDay(d, month, year, false, goalMap, holidayMap, today));
    const rem = (grid.children.length <= 35 ? 35 : 42) - grid.children.length;
    for (let d = 1; d <= rem; d++)
        grid.appendChild(buildDay(d, month+1, year, true, goalMap, holidayMap, today));
}

function buildDay(day, month, year, isOther, goalMap, holidayMap, today) {
    let ry = year, rm = month;
    if (month < 0)  { rm = 11; ry = year - 1; }
    if (month > 11) { rm = 0;  ry = year + 1; }
    const dateStr = toDateStrParts(ry, rm+1, day);

    const cell = document.createElement('div');
    cell.className = 'day';
    if (isOther) { cell.classList.add('other-month'); cell.innerHTML = `<div class="day-num">${day}</div>`; return cell; }

    if (dateStr === today)           cell.classList.add('today');
    if (dateStr === selectedDateStr) cell.classList.add('selected');

    const goalsHere    = goalMap[dateStr]    || [];
    const holidaysHere = holidayMap[dateStr] || [];
    if (goalsHere.length)    cell.classList.add('has-goal');
    if (holidaysHere.length) cell.classList.add('has-holiday');

    const numEl = document.createElement('div');
    numEl.className = 'day-num';
    numEl.textContent = day;
    cell.appendChild(numEl);

    if (goalsHere.length || holidaysHere.length) {
        const dotsEl = document.createElement('div');
        dotsEl.className = 'day-dots';
        goalsHere.slice(0,2).forEach(g => {
            const d = document.createElement('div');
            d.className = 'dot';
            d.style.background = g.priority==='high' ? 'var(--danger)' : g.priority==='medium' ? 'var(--accent)' : 'var(--success)';
            dotsEl.appendChild(d);
        });
        if (goalsHere.length > 2) { const m=document.createElement('div'); m.className='dot more'; m.textContent='+'+(goalsHere.length-2); dotsEl.appendChild(m); }
        holidaysHere.forEach(() => { const d=document.createElement('div'); d.className='dot'; d.style.background='var(--holiday)'; dotsEl.appendChild(d); });
        cell.appendChild(dotsEl);
    }

    cell.addEventListener('click', () => selectDate(dateStr));
    return cell;
}

function selectDate(dateStr) {
    selectedDateStr = dateStr;
    renderCalendar();
    const [y, m, d] = dateStr.split('-');
    document.getElementById('detailTitle').textContent = `${MONTHS[parseInt(m)-1]} ${parseInt(d)}, ${y}`;

    const { goalMap, holidayMap } = buildMaps();
    const goalsHere    = goalMap[dateStr]    || [];
    const holidaysHere = holidayMap[dateStr] || [];
    const statusLabel  = { pending:'Pending', in_progress:'In Progress', completed:'Completed' };

    let html = '';
    if (holidaysHere.length) {
        html += `<div class="section-label" style="color:var(--holiday)"><i class="fas fa-umbrella-beach"></i> Holidays</div>`;
        holidaysHere.forEach(h => {
            html += `<div class="holiday-item">
                <button class="holiday-del" onclick="deleteHoliday(${h.id})"><i class="fas fa-trash"></i></button>
                <h4>${escHtml(h.name)}</h4>
                ${h.description ? `<p>${escHtml(h.description)}</p>` : ''}
            </div>`;
        });
    }
    if (goalsHere.length) {
        if (html) html += '<div style="height:.5rem"></div>';
        html += `<div class="section-label" style="color:var(--primary)"><i class="fas fa-bullseye"></i> Goals</div>`;
        goalsHere.forEach(g => {
            html += `<div class="goal-item priority-${g.priority}">
                <h4>${escHtml(g.goal_text)}</h4>
                <div class="goal-badges">
                    <span class="badge ${g.priority}">${g.priority}</span>
                    <span class="badge ${g.status}">${statusLabel[g.status]||g.status}</span>
                </div>
            </div>`;
        });
    }
    if (!html) html = `<div class="empty-panel"><i class="fas fa-calendar-xmark"></i><p style="font-size:.8rem">Nothing on this date.</p></div>`;

    html += `<button class="nudge-btn" onclick="openModal('${dateStr}')"><i class="fas fa-plus"></i> Add holiday on this date</button>`;
    document.getElementById('detailBody').innerHTML = html;
}

function renderHolidaysOverview() {
    const el = document.getElementById('holidaysOverview');
    if (!allHolidays.length) { el.innerHTML = `<div class="empty-panel"><i class="fas fa-sun"></i><p style="font-size:.8rem">No holidays added yet</p></div>`; return; }
    const sorted = [...allHolidays].sort((a,b) => a.date.localeCompare(b.date));
    el.innerHTML = sorted.map(h => {
        const [y,m,d] = h.date.split('-');
        const lbl = `${MONTHS[parseInt(m)-1].slice(0,3)} ${parseInt(d)}, ${y}`;
        return `<div class="holiday-item" style="margin-bottom:.4rem">
            <button class="holiday-del" onclick="deleteHoliday(${h.id})"><i class="fas fa-trash"></i></button>
            <h4>${escHtml(h.name)}</h4>
            <p>${lbl}${h.description ? ' · '+escHtml(h.description).slice(0,50)+(h.description.length>50?'…':'') : ''}</p>
        </div>`;
    }).join('');
}

function openModal(prefillDate) {
    document.getElementById('holidayName').value = '';
    document.getElementById('holidayDesc').value = '';
    document.getElementById('holidayDate').value = prefillDate || '';
    ['holidayDate','holidayName'].forEach(id => document.getElementById(id).classList.remove('error'));
    document.getElementById('holidayModal').classList.add('open');
    setTimeout(() => document.getElementById('holidayName').focus(), 100);
}

function closeModal() { document.getElementById('holidayModal').classList.remove('open'); }

async function saveHoliday() {
    const date = document.getElementById('holidayDate').value;
    const name = document.getElementById('holidayName').value.trim();
    const desc = document.getElementById('holidayDesc').value.trim();
    document.getElementById('holidayDate').classList.toggle('error', !date);
    document.getElementById('holidayName').classList.toggle('error', !name);
    if (!date || !name) return;

    const btn = document.getElementById('saveHolidayBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

    try {
        const fd = new FormData();
        fd.append('date', date); fd.append('name', name); fd.append('description', desc);
        const res  = await fetch(`${API}/add_holiday.php`, { method:'POST', body:fd, credentials:'include' });
        const data = await res.json();
        if (data.success) {
            allHolidays.push(data.holiday);
            closeModal(); renderCalendar(); renderHolidaysOverview();
            if (selectedDateStr === date) selectDate(date);
            showToast('Holiday added!', 'success');
        } else {
            showToast(data.message || 'Failed to save holiday', 'error');
        }
    } catch { showToast('Network error', 'error'); }
    finally { btn.disabled=false; btn.innerHTML='<i class="fas fa-check"></i> Save Holiday'; }
}

async function deleteHoliday(id) {
    if (!confirm('Delete this holiday?')) return;
    try {
        const fd = new FormData(); fd.append('id', id);
        const res  = await fetch(`${API}/delete_holiday.php`, { method:'POST', body:fd, credentials:'include' });
        const data = await res.json();
        if (data.success) {
            allHolidays = allHolidays.filter(h => h.id != id);
            renderCalendar(); renderHolidaysOverview();
            if (selectedDateStr) selectDate(selectedDateStr);
            showToast('Holiday deleted', 'success');
        } else { showToast(data.message || 'Could not delete', 'error'); }
    } catch { showToast('Network error', 'error'); }
}

function showToast(msg, type='success') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fas ${type==='success'?'fa-check-circle':'fa-exclamation-circle'}"></i> ${msg}`;
    document.getElementById('toastWrap').appendChild(t);
    setTimeout(() => { t.style.transition='opacity .3s'; t.style.opacity='0'; setTimeout(()=>t.remove(),320); }, 3000);
}

function toDateStr(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function toDateStrParts(y,m,d) { return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function escHtml(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function logout() { fetch(`${API}/logout.php`,{credentials:'include'}).then(()=>window.location.href='../../index.html'); }
