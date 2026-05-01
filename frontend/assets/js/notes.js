/* ============================================
   notes.js  –  Student Productivity Hub
   ============================================ */

const API = '../../backend';

/* ── State ─────────────────────────────────── */
let allNotes       = [];
let notesLoaded    = false;
let activeFilter   = 'all';
let droppedFile    = null;   // holds the drag-and-dropped File object
let selectedNoteId = null;   // currently viewed note in the right panel

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

const notesViewer      = document.getElementById('notesViewer');
const viewerEmpty      = document.getElementById('viewerEmpty');
const viewerContent    = document.getElementById('viewerContent');
const viewerBadge      = document.getElementById('viewerBadge');
const viewerDate       = document.getElementById('viewerDate');
const viewerReadTime   = document.getElementById('viewerReadTime');
const viewerBody       = document.getElementById('viewerBody');
const viewerEditBtn    = document.getElementById('viewerEditBtn');
const viewerDeleteBtn  = document.getElementById('viewerDeleteBtn');

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
    const readBadge = (note.read_time)
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

    const action = `<button class="view-btn" onclick="selectNote(${note.id}); event.stopPropagation();">
              View <i class="fas fa-chevron-right"></i>
           </button>`;
    const editAction = isPdf
        ? `<button onclick="openEditPdfModal(${note.id})">
               <i class="fas fa-file-pdf"></i> Replace PDF
           </button>`
        : `<button onclick="openEditModal(${note.id})">
               <i class="fas fa-edit"></i> Edit
           </button>`;
 
    return `
    <div class="note-card" data-id="${note.id}" data-type="${isPdf ? 'pdf' : 'text'}" onclick="selectNote(${note.id})">
        <div class="note-card-header">
            ${badge}
            <div class="note-card-menu">
                <button class="menu-btn" title="Options"
                        onclick="toggleMenu(event,${note.id})">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="dropdown-menu" id="menu-${note.id}">
                    ${editAction}
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
    document.querySelectorAll('.dropdown-menu.open').forEach(m => m.classList.remove('open'));
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
            notesSection.style.display = 'flex';
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
        if (e.key === 'Escape'){
            if (modalOverlay.classList.contains('open')) closeModal();
            if (editModalOverlay.classList.contains('open')) closeEditModalFn();
            if (editPdfModalOverlay.classList.contains('open')) closeEditPdfModalFn();
        }
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

        /* ── Edit modal events ── */
    closeEditModal.addEventListener('click', closeEditModalFn);
    editCancelBtn.addEventListener('click',  closeEditModalFn);
    editModalOverlay.addEventListener('click', e => {
        if (e.target === editModalOverlay) closeEditModalFn();
    });
    editNoteForm.addEventListener('submit', submitEditNote);
    /* ── Edit PDF modal events ── */
    closeEditPdfModal.addEventListener('click', closeEditPdfModalFn);
    editPdfCancelBtn.addEventListener('click',  closeEditPdfModalFn);
    editPdfModalOverlay.addEventListener('click', e => {
        if (e.target === editPdfModalOverlay) closeEditPdfModalFn();
    });
    editPdfForm.addEventListener('submit', submitEditPdf);
 
    editPdfDropZone.addEventListener('dragover', e => {
        e.preventDefault();
        editPdfDropZone.classList.add('dragover');
    });
    editPdfDropZone.addEventListener('dragleave', () => editPdfDropZone.classList.remove('dragover'));
    editPdfDropZone.addEventListener('drop', e => {
        e.preventDefault();
        editPdfDropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleEditPdfFileSelect(file);
    });
    editPdfFileInput.addEventListener('change', () => {
        if (editPdfFileInput.files[0]) handleEditPdfFileSelect(editPdfFileInput.files[0]);
    });
    editPdfRemoveFile.addEventListener('click', clearEditPdfFileChosen);

    /* ── Viewer panel buttons ── */
    viewerEditBtn.addEventListener('click', () => {
        if (!selectedNoteId) return;
        const note = allNotes.find(n => n.id == selectedNoteId);
        if (!note) return;
        if (note.file_path) {
            openEditPdfModal(selectedNoteId);
        } else {
            openEditModal(selectedNoteId);
        }
    });
    viewerDeleteBtn.addEventListener('click', () => {
        if (selectedNoteId) deleteNote(selectedNoteId);
    });
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
/* ── Edit PDF file helpers ───────────────────── */
function handleEditPdfFileSelect(file) {
    editDroppedFile = file;
    editPdfFileChosenName.textContent = file.name;
    editPdfFileChosen.style.display   = 'flex';
    editPdfDropZone.style.display     = 'none';
}
 
function clearEditPdfFileChosen() {
    editDroppedFile                = null;
    editPdfFileInput.value         = '';
    editPdfFileChosen.style.display = 'none';
    editPdfDropZone.style.display  = 'block';
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
            notesSection.style.display = 'flex';
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
    fd.append('note_text', '');       // empty for PDF-only notes
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
            notesSection.style.display = 'flex';
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
/* ══════════════════════════════════════════════
   EDIT — TEXT NOTE
   ══════════════════════════════════════════════ */
function openEditModal(id) {
    closeAllMenus();
    const note = allNotes.find(n => n.id == id);
    if (!note) return;
 
    editNoteId.value    = id;
    editNoteText.value  = note.note_text || '';
    editModalOverlay.classList.add('open');
    setTimeout(() => editNoteText.focus(), 100);
}
 
function closeEditModalFn() {
    editModalOverlay.classList.remove('open');
    setTimeout(() => {
        editNoteForm.reset();
        editNoteId.value = '';
    }, 300);
}
 
async function submitEditNote(e) {
    e.preventDefault();
    const id   = editNoteId.value;
    const text = editNoteText.value.trim();
    if (!text) { showToast('Note text cannot be empty.', 'error'); return; }
 
    setLoading(editSubmitBtn, true, 'Saving…');
    const fd = new FormData();
    fd.append('note_id',   id);
    fd.append('note_text', text);
 
    try {
        const res = await fetch(`${API}/update_note.php`, {
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
            // Update local state
            const idx = allNotes.findIndex(n => n.id == id);
            if (idx !== -1) {
                allNotes[idx].note_text = text;
                // Use read_time from backend response
                allNotes[idx].read_time = data.read_time || 1;
            }
            applyFilters();
            /* refresh viewer if this note is currently displayed */
            if (selectedNoteId == id) selectNote(id);
            closeEditModalFn();
            showToast('Note updated!', 'success');
        } else {
            showToast(data.message || 'Error updating note.', 'error');
        }
    } catch (err) {
        showToast('Network error: ' + err.message, 'error');
    } finally {
        setLoading(editSubmitBtn, false, '<i class="fas fa-save"></i> Save Changes');
    }
}
 
/* ══════════════════════════════════════════════
   EDIT — PDF NOTE (replace PDF)
   ══════════════════════════════════════════════ */
function openEditPdfModal(id) {
    closeAllMenus();
    const note = allNotes.find(n => n.id == id);
    if (!note) return;
 
    editPdfNoteId.value = id;
    clearEditPdfFileChosen();
    editPdfModalOverlay.classList.add('open');
}
 
function closeEditPdfModalFn() {
    editPdfModalOverlay.classList.remove('open');
    setTimeout(() => {
        editPdfForm.reset();
        editPdfNoteId.value = '';
        clearEditPdfFileChosen();
    }, 300);
}
 
async function submitEditPdf(e) {
    e.preventDefault();
    const id   = editPdfNoteId.value;
    const file = editDroppedFile || (editPdfFileInput.files && editPdfFileInput.files[0]);
 
    if (!file) {
        showToast('Please select a PDF file.', 'error');
        return;
    }
 
    setLoading(editPdfSubmitBtn, true, 'Uploading…');
 
    // Delete old note, then create a new one with the new PDF
    // First delete the old note
    try {
        const delFd = new FormData();
        delFd.append('note_id', id);
        const delRes  = await fetch(`${API}/delete_note.php`, {
            method: 'POST',
            body: delFd,
            credentials: 'include'
        });
        const delRaw  = await delRes.text();
        let delData;
        try { delData = JSON.parse(delRaw); }
        catch { showToast('Error replacing PDF.', 'error'); return; }
 
        if (!delData.success) {
            showToast(delData.message || 'Could not replace PDF.', 'error');
            return;
        }
 
        // Now upload the new PDF
        const fd = new FormData();
        fd.append('note_text', '');   // empty for PDF-only notes
        fd.append('file', file);
        const res = await fetch(`${API}/add_notes.php`, {
            method: 'POST',
            body: fd,
            credentials: 'include'
        });
        const raw = await res.text();
        let data;
        try { data = JSON.parse(raw); }
        catch { showToast('Server error: ' + raw.slice(0, 120), 'error'); return; }
 
        if (data.success) {
            // Remove old from state, add new at front
            allNotes = allNotes.filter(n => n.id != id);
            allNotes.unshift(data.note);
            applyFilters();
            closeEditPdfModalFn();
            showToast('PDF replaced!', 'success');
        } else {
            showToast(data.message || 'Error uploading replacement PDF.', 'error');
        }
    } catch (err) {
        showToast('Network error: ' + err.message, 'error');
    } finally {
        setLoading(editPdfSubmitBtn, false, '<i class="fas fa-upload"></i> Replace PDF');
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
            /* reset viewer if we just deleted the displayed note */
            if (selectedNoteId == id) {
                selectedNoteId = null;
                viewerContent.style.display = 'none';
                viewerEmpty.style.display   = 'grid';
            }
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

/* ── Select / view note in the right panel ───── */
function selectNote(id) {
    const note = allNotes.find(n => n.id == id);
    if (!note) return;

    selectedNoteId = id;
    const isPdf = !!note.file_path;

    /* highlight the selected card in the list */
    document.querySelectorAll('.note-card').forEach(c => c.classList.remove('selected'));
    const card = document.querySelector(`.note-card[data-id="${id}"]`);
    if (card) card.classList.add('selected');

    /* badge */
    if (isPdf) {
        viewerBadge.className = 'pill danger';
        viewerBadge.innerHTML = '<i class="fas fa-file-pdf"></i> PDF';
    } else {
        viewerBadge.className = 'pill info';
        viewerBadge.innerHTML = '<i class="fas fa-align-left"></i> Text';
    }

    /* date */
    viewerDate.innerHTML = `<i class="fas fa-clock"></i> ${formatDate(note.created_at)}`;

    /* read time */
    if (note.read_time) {
        viewerReadTime.style.display = 'inline-flex';
        viewerReadTime.innerHTML = `<i class="fas fa-book-open"></i> ${note.read_time} min read`;
    } else {
        viewerReadTime.style.display = 'none';
    }

    /* edit button label */
    if (isPdf) {
        viewerEditBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Replace PDF';
    } else {
        viewerEditBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
    }

    /* body content */
    if (isPdf) {
        const pdfUrl = `../../${note.file_path}`;
        viewerBody.innerHTML = `
            <div class="viewer-pdf-header">
                <i class="fas fa-file-pdf"></i>
                <span>${escHtml(pdfName(note.file_path))}</span>
                <a href="${pdfUrl}" target="_blank" class="btn" style="margin-left:auto;">
                    <i class="fas fa-external-link-alt"></i> Open in New Tab
                </a>
            </div>
            <iframe class="viewer-pdf-frame" src="${pdfUrl}" title="PDF Preview"></iframe>`;
    } else {
        viewerBody.innerHTML = `
            <div class="viewer-text-content">${escHtml(note.note_text)}</div>`;
    }

    /* show viewer, hide empty state */
    viewerEmpty.style.display   = 'none';
    viewerContent.style.display = 'flex';
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
        .then(() => { window.location.href = '../../index.html'; });
}
