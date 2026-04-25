/* ============================================
   notes.js  –  Student Productivity Hub
   ============================================ */

// Root-relative — works on any port (8080, 8888, 80, etc.)
const API = '/Student-Productivity-Hub/backend';

/* ── State ─────────────────────────────────── */
let allNotes     = [];
let notesLoaded  = false;
let activeFilter = 'all';
let droppedFile  = null;   // holds the drag-and-dropped File object

/* ── DOM Refs ──────────────────────────────── */
const notesGrid        = document.getElementById('notesGrid');
const searchInput      = document.getElementById('searchInput');
const addNoteBtn       = document.getElementById('addNoteBtn');
const loadNotesBtn     = document.getElementById('loadNotesBtn');
const notesSection     = document.getElementById('notesSection');

const modalOverlay     = document.getElementById('modalOverlay');
const chooserView      = document.getElementById('chooserView');
const textCard         = document.getElementById('textCard');
const pdfCard          = document.getElementById('pdfCard');
const chooserNextBtn   = document.getElementById('chooserNextBtn');
const chooserCancelBtn = document.getElementById('chooserCancelBtn');

const textFormView     = document.getElementById('textFormView');
const textForm         = document.getElementById('textForm');
const noteTextArea     = document.getElementById('noteText');
const textBackBtn      = document.getElementById('textBackBtn');
const textSubmitBtn    = document.getElementById('textSubmitBtn');

const pdfFormView      = document.getElementById('pdfFormView');
const pdfForm          = document.getElementById('pdfForm');
const dropZone         = document.getElementById('dropZone');
const pdfFileInput     = document.getElementById('pdfFileInput');
const fileChosen       = document.getElementById('fileChosen');
const fileChosenName   = document.getElementById('fileChosenName');
const removeFileBtn    = document.getElementById('removeFileBtn');
const pdfBackBtn       = document.getElementById('pdfBackBtn');
const pdfSubmitBtn     = document.getElementById('pdfSubmitBtn');

const closeTextModal   = document.getElementById('closeTextModal');
const closePdfModal    = document.getElementById('closePdfModal');
const filterTabs       = document.querySelectorAll('.filter-tab');
const toastContainer   = document.getElementById('toastContainer');

const editModalOverlay  = document.getElementById('editModalOverlay');
const editNoteForm      = document.getElementById('editNoteForm');
const editNoteText      = document.getElementById('editNoteText');
const editNoteId        = document.getElementById('editNoteId');
const closeEditModal    = document.getElementById('closeEditModal');
const editCancelBtn     = document.getElementById('editCancelBtn');
const editSubmitBtn     = document.getElementById('editSubmitBtn');

const editPdfModalOverlay = document.getElementById('editPdfModalOverlay');
const editPdfForm         = document.getElementById('editPdfForm');
const editPdfFileInput    = document.getElementById('editPdfFileInput');
const editPdfDropZone     = document.getElementById('editPdfDropZone');
const editPdfFileChosen   = document.getElementById('editPdfFileChosen');
const editPdfFileChosenName = document.getElementById('editPdfFileChosenName');
const editPdfRemoveFile   = document.getElementById('editPdfRemoveFile');
const closeEditPdfModal   = document.getElementById('closeEditPdfModal');
const editPdfCancelBtn    = document.getElementById('editPdfCancelBtn');
const editPdfSubmitBtn    = document.getElementById('editPdfSubmitBtn');
const editPdfNoteId       = document.getElementById('editPdfNoteId');

let editDroppedFile = null;

/* ══════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    bindEvents();
});

/* ── Auth check ─────────────────────────────── */
function checkAuth() {
    fetch(`${API}/check_auth.php`, { credentials: 'include' })
        .then(r => r.text())
        .then(res => {
            if (res.trim() === 'unauthorized') {
                window.location.href = 'login.html';
            }
        })
        .catch(() => {});
}

/* ══════════════════════════════════════════════
   LOAD & RENDER NOTES
   ══════════════════════════════════════════════ */
function loadNotes() {
    showSkeletons();
    fetch(`${API}/get_notes.php`, { credentials: 'include' })
        .then(r => r.text())
        .then(text => {
            let data;
            try { data = JSON.parse(text); }
            catch { notesGrid.innerHTML = errorState('Server error: ' + text.slice(0, 120)); return; }

            if (data.success) {
                allNotes    = data.notes;
                notesLoaded = true;
                renderNotes(allNotes);
                if (loadNotesBtn) {
                    loadNotesBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Notes';
                }
            } else {
                notesGrid.innerHTML = errorState(data.message || 'Could not load notes.');
            }
        })
        .catch(err => {
            notesGrid.innerHTML = errorState('Network error: ' + err.message);
        });
}

function renderNotes(notes) {
    if (!notes.length) {
        notesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <h3>No notes yet</h3>
                <p>Click <strong>+ Add Note</strong> to create your first note.</p>
            </div>`;
        return;
    }
    notesGrid.innerHTML = notes.map(noteCard).join('');
    notesGrid.querySelectorAll('.note-card').forEach((el, i) => {
        el.style.animationDelay = `${i * 55}ms`;
    });
    attachCardEvents();
}

function noteCard(note) {
    const isPdf    = !!note.file_path;
    const date     = formatDate(note.created_at);
    const readBadge = (!isPdf && note.read_time)
        ? `<span class="read-time-badge"><i class="fas fa-book-open"></i> ${note.read_time} min read</span>`
        : '';
    const badge  = isPdf
        ? `<span class="note-type-badge pdf-type"><i class="fas fa-file-pdf"></i> PDF</span>`
        : `<span class="note-type-badge text-type"><i class="fas fa-align-left"></i> Text</span>`;

    const body   = isPdf
        ? `<div class="note-pdf-preview">
               <i class="fas fa-file-pdf"></i>
               <span>${escHtml(pdfName(note.file_path))}</span>
           </div>`
        : `<p>${escHtml(note.note_text)}</p>`;

    const action = isPdf
        ? `<a class="view-btn"
              href="http://localhost/Student-Productivity-Hub/${escHtml(note.file_path)}"
              target="_blank">
              Open PDF <i class="fas fa-external-link-alt"></i>
           </a>`
        : `<button class="view-btn" onclick="expandNote(${note.id})">
              View <i class="fas fa-chevron-right"></i>
           </button>`;

    return `
    <div class="note-card" data-id="${note.id}" data-type="${isPdf ? 'pdf' : 'text'}">
        <div class="note-card-header">
            ${badge}
            <div class="note-card-menu">
                <button class="menu-btn" title="Options"
                        onclick="toggleMenu(event,${note.id})">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="dropdown-menu" id="menu-${note.id}">
                    <button class="del-btn" onclick="deleteNote(${note.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
        <div class="note-card-body">${body}</div>
        <div class="note-card-footer">
            <span class="note-date"><i class="fas fa-clock"></i> ${date}</span>
            ${readBadge}
            ${action}
        </div>
    </div>`;
}

function showSkeletons() {
    notesGrid.innerHTML = Array(6).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skel-line short"></div>
            <div class="skel-line medium" style="margin-top:.5rem"></div>
            <div class="skel-line full"  style="margin-top:1rem"></div>
            <div class="skel-line long"  style="margin-top:.5rem"></div>
        </div>`).join('');
}

function errorState(msg) {
    return `<div class="empty-state">
        <i class="fas fa-exclamation-circle" style="color:var(--danger)"></i>
        <h3>${escHtml(msg)}</h3>
        <p>Please try again or refresh the page.</p>
    </div>`;
}

/* ── Card events ────────────────────────────── */
function attachCardEvents() {
    document.addEventListener('click', closeAllMenus);
}

function toggleMenu(e, id) {
    e.stopPropagation();
    const menu   = document.getElementById(`menu-${id}`);
    const isOpen = menu.classList.contains('open');
    closeAllMenus();
    if (!isOpen) menu.classList.add('open');
}

function closeAllMenus() {
    document.querySelectorAll('.dropdown-menu.open')
            .forEach(m => m.classList.remove('open'));
}

/* ── Filters & Search ────────────────────────── */
filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.dataset.filter;
        if (notesLoaded) applyFilters();
    });
});

function applyFilters() {
    let filtered = [...allNotes];
    if (activeFilter === 'text') filtered = filtered.filter(n => !n.file_path);
    if (activeFilter === 'pdf')  filtered = filtered.filter(n => !!n.file_path);

    const q = searchInput.value.trim().toLowerCase();
    if (q) {
        filtered = filtered.filter(n =>
            (n.note_text && n.note_text.toLowerCase().includes(q)) ||
            (n.file_path && pdfName(n.file_path).toLowerCase().includes(q))
        );
    }
    renderNotes(filtered);
}

searchInput.addEventListener('input', () => { if (notesLoaded) applyFilters(); });

/* ══════════════════════════════════════════════
   EVENT BINDING
   ══════════════════════════════════════════════ */
function bindEvents() {
    if (loadNotesBtn) {
        loadNotesBtn.addEventListener('click', () => {
            notesSection.style.display = 'block';
            loadNotes();
        });
    }

    addNoteBtn.addEventListener('click', openChooser);

    textCard.addEventListener('click', () => {
        textCard.classList.add('selected');
        pdfCard.classList.remove('selected');
    });
    pdfCard.addEventListener('click', () => {
        pdfCard.classList.add('selected');
        textCard.classList.remove('selected');
    });

    chooserNextBtn.addEventListener('click', () => {
        if (textCard.classList.contains('selected')) {
            chooserView.style.display = 'none';
            textFormView.classList.add('visible');
        } else if (pdfCard.classList.contains('selected')) {
            chooserView.style.display = 'none';
            pdfFormView.classList.add('visible');
        } else {
            showToast('Please select a note type first.', 'error');
        }
    });

    chooserCancelBtn.addEventListener('click', closeModal);
    closeTextModal.addEventListener('click',   closeModal);
    closePdfModal.addEventListener('click',    closeModal);

    textBackBtn.addEventListener('click', () => {
        textFormView.classList.remove('visible');
        chooserView.style.display = 'block';
    });
    pdfBackBtn.addEventListener('click', () => {
        pdfFormView.classList.remove('visible');
        chooserView.style.display = 'block';
    });

    modalOverlay.addEventListener('click', e => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
    });

    /* ── Drop zone ── */
    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    });

    /* File input (click-to-browse) */
    pdfFileInput.addEventListener('change', () => {
        if (pdfFileInput.files[0]) handleFileSelect(pdfFileInput.files[0]);
    });

    removeFileBtn.addEventListener('click', clearFileChosen);

    textForm.addEventListener('submit', submitTextNote);
    pdfForm.addEventListener('submit',  submitPdfNote);
}

/* ── Modal helpers ───────────────────────────── */
function openChooser() {
    resetModal();
    modalOverlay.classList.add('open');
}

function closeModal() {
    modalOverlay.classList.remove('open');
    setTimeout(resetModal, 300);
}

function resetModal() {
    chooserView.style.display = 'block';
    textFormView.classList.remove('visible');
    pdfFormView.classList.remove('visible');
    textCard.classList.remove('selected');
    pdfCard.classList.remove('selected');
    textForm.reset();
    pdfForm.reset();
    clearFileChosen();
}

/* ── File helpers ────────────────────────────── */
function handleFileSelect(file) {
    if (file.type !== 'application/pdf') {
        showToast('Only PDF files are accepted.', 'error');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showToast('File must be under 10 MB.', 'error');
        return;
    }
    droppedFile = file;                       // store for use in submitPdfNote
    fileChosenName.textContent = file.name;
    fileChosen.style.display   = 'flex';
    dropZone.style.display     = 'none';
}

function clearFileChosen() {
    droppedFile               = null;
    pdfFileInput.value        = '';
    fileChosen.style.display  = 'none';
    dropZone.style.display    = 'block';
}

/* ══════════════════════════════════════════════
   SUBMIT — TEXT NOTE
   ══════════════════════════════════════════════ */
async function submitTextNote(e) {
    e.preventDefault();
    const text = noteTextArea.value.trim();
    if (!text) { showToast('Please enter some note text.', 'error'); return; }

    setLoading(textSubmitBtn, true, 'Saving…');
    const fd = new FormData();
    fd.append('note_text', text);

    try {
        const res  = await fetch(`${API}/add_notes.php`, {
            method: 'POST',
            body: fd,
            credentials: 'include'
        });

        const raw = await res.text();
        let data;
        try { data = JSON.parse(raw); }
        catch {
            showToast('Server error: ' + raw.slice(0, 120), 'error');
            return;
        }

        if (data.success) {
            allNotes.unshift(data.note);
            notesLoaded = true;
            notesSection.style.display = 'block';
            applyFilters();
            closeModal();
            showToast('Text note saved!', 'success');
        } else {
            showToast(data.message || 'Error saving note.', 'error');
        }
    } catch (err) {
        showToast('Network error: ' + err.message, 'error');
    } finally {
        setLoading(textSubmitBtn, false, '<i class="fas fa-save"></i> Save Note');
    }
}

/* ══════════════════════════════════════════════
   SUBMIT — PDF NOTE
   ══════════════════════════════════════════════ */
async function submitPdfNote(e) {
    e.preventDefault();

    // Prefer the drag-and-dropped file, fall back to the file input
    const file = droppedFile || (pdfFileInput.files && pdfFileInput.files[0]);

    if (!file) {
        showToast('Please select a PDF file.', 'error');
        return;
    }

    setLoading(pdfSubmitBtn, true, 'Uploading…');
    const fd = new FormData();
    fd.append('file', file);          // append the File object directly

    try {
        const res = await fetch(`${API}/add_notes.php`, {
            method: 'POST',
            body: fd,
            credentials: 'include'
        });

        // Read as text first so a PHP warning doesn't swallow the real error
        const raw = await res.text();
        let data;
        try { data = JSON.parse(raw); }
        catch {
            showToast('Server error: ' + raw.slice(0, 120), 'error');
            return;
        }

        if (data.success) {
            allNotes.unshift(data.note);
            notesLoaded = true;
            notesSection.style.display = 'block';
            applyFilters();
            closeModal();
            showToast('PDF note uploaded!', 'success');
        } else {
            showToast(data.message || 'Error uploading file.', 'error');
        }
    } catch (err) {
        showToast('Network error: ' + err.message, 'error');
    } finally {
        setLoading(pdfSubmitBtn, false, '<i class="fas fa-upload"></i> Upload PDF');
    }
}

/* ── Delete note ─────────────────────────────── */
async function deleteNote(id) {
    if (!confirm('Delete this note? This cannot be undone.')) return;

    const fd = new FormData();
    fd.append('note_id', id);

    try {
        const res  = await fetch(`${API}/delete_note.php`, {
            method: 'POST',
            body: fd,
            credentials: 'include'
        });
        const raw  = await res.text();
        let data;
        try { data = JSON.parse(raw); }
        catch { showToast('Server error: ' + raw.slice(0, 80), 'error'); return; }

        if (data.success) {
            allNotes = allNotes.filter(n => n.id != id);
            applyFilters();
            showToast('Note deleted.', 'success');
        } else {
            showToast(data.message || 'Could not delete note.', 'error');
        }
    } catch (err) {
        showToast('Network error: ' + err.message, 'error');
    }
}

/* ── Expand text note ────────────────────────── */
function expandNote(id) {
    const note = allNotes.find(n => n.id == id);
    if (!note) return;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(15,23,42,.6);
        display:flex;align-items:center;justify-content:center;
        z-index:900;padding:1.5rem;backdrop-filter:blur(4px);`;
    overlay.innerHTML = `
        <div style="background:#fff;border-radius:1rem;max-width:600px;width:100%;
                    max-height:80vh;overflow-y:auto;
                    box-shadow:0 20px 60px rgba(0,0,0,.2);">
            <div style="padding:1.2rem 1.5rem;border-bottom:1px solid #e2e8f0;
                        display:flex;justify-content:space-between;align-items:center;">
                <h3 style="font-size:1.1rem;color:#1e293b">
                    <i class="fas fa-sticky-note" style="color:#6366f1;margin-right:.5rem"></i>Note
                </h3>
                <button onclick="this.closest('[style]').remove()"
                        style="background:none;border:none;font-size:1.3rem;
                               cursor:pointer;color:#64748b;line-height:1;">×</button>
            </div>
            <div style="padding:1.5rem;font-size:.96rem;line-height:1.75;
                        color:#334155;white-space:pre-wrap;">${escHtml(note.note_text)}</div>
        </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

/* ── Utilities ───────────────────────────────── */
function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts.replace(' ', 'T'));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pdfName(filePath) {
    if (!filePath) return '';
    return filePath.split('/').pop().replace(/^\d+_/, '');
}

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
              .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function setLoading(btn, loading, label) {
    btn.disabled = loading;
    btn.innerHTML = loading ? `<i class="fas fa-spinner fa-spin"></i> ${label}` : label;
}

/* ── Toast ───────────────────────────────────── */
function showToast(msg, type = 'info') {
    const icons = { success:'fa-check-circle', error:'fa-exclamation-circle', info:'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${msg}`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut .35s ease forwards';
        setTimeout(() => toast.remove(), 360);
    }, 4000);
}

/* ── Logout ──────────────────────────────────── */
function logout() {
    fetch(`${API}/logout.php`, { credentials: 'include' })
        .then(() => { window.location.href = '../index.html'; });
}
