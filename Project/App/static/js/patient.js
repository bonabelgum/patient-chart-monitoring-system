document.addEventListener('DOMContentLoaded', function () {
    //retrieve the patient data from sessionStorage
    const patientId = sessionStorage.getItem('data-patient-id');
    const patientName = sessionStorage.getItem('data-patient-name');
    const patientWard = sessionStorage.getItem('data-patient-ward');
    const patientStatus = sessionStorage.getItem('data-patient-status');

    //display the patient data on the page
    if (document.getElementById('patient-id')) {
        document.getElementById('patient-id').textContent = patientId || 'N/A';
        document.getElementById('patient-name').textContent = patientName || 'N/A';
        document.getElementById('patient-ward').textContent = patientWard || 'N/A';
        document.getElementById('patient-status').textContent = patientStatus || 'N/A';
    }

    //clear the sessionStorage after displaying the data
    sessionStorage.clear();
});

//MEMO/NOTES
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables at the top level
    let notesList, addNoteBtn;
    
    // Main initialization function
    function initNotesSystem() {
        // Set up tab event listener
        const noteTab = document.querySelector('#note-tab');
        if (noteTab) {
            noteTab.addEventListener('shown.bs.tab', function() {
                initNotes();
            });
        } else {
            console.warn('Could not find element with ID #note-tab');
        }
        // Also initialize if we're already on the notes tab
        if (document.querySelector('#note.active')) {
            initNotes();
        }
    }
    
    // Initialize notes functionality
    function initNotes() {
        notesList = document.getElementById('notes-list');
        addNoteBtn = document.getElementById('add-note-btn');
        if (!notesList) console.error('Could not find element with ID #notes-list');
        if (!addNoteBtn) console.error('Could not find element with ID #add-note-btn');
        if (!notesList || !addNoteBtn) {
            console.error('Could not initialize notes - required elements missing');
            return;
        }
        
        // Remove any existing event listeners
        const newAddNoteBtn = addNoteBtn.cloneNode(true);
        addNoteBtn.parentNode.replaceChild(newAddNoteBtn, addNoteBtn);
        addNoteBtn = newAddNoteBtn;   
        // Add new event listener
        addNoteBtn.addEventListener('click', function() {
            addNewNote();
        });
        // Load existing notes
        loadNotes();
    }
    
    function addNewNote() {
        const now = new Date();
        const timestamp = formatDateTime(now);   
        const noteId = Date.now(); // Unique ID for each note
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.dataset.id = noteId;
        noteElement.innerHTML = `
            <div class="note-header">
                <div class="note-title">Nurse's Note</div>
                <div class="note-time">${timestamp}</div>
            </div>
            <div class="note-content" contenteditable="true" placeholder="Enter your note here..."></div>
            <div class="note-actions">
                <button class="note-btn btn-save">Save</button>
                <button class="note-btn btn-edit">Edit</button>
                <button class="note-btn btn-delete">Delete</button>
            </div>
        `;
        
        notesList.prepend(noteElement);
        setupNoteEvents(noteElement, true);  
        noteElement.querySelector('.note-content').focus();
    }
    
    function setupNoteEvents(noteElement, isNew = false) {
        const content = noteElement.querySelector('.note-content');
        const editBtn = noteElement.querySelector('.btn-edit');
        const saveBtn = noteElement.querySelector('.btn-save');
        const deleteBtn = noteElement.querySelector('.btn-delete');
        
        if (!content) console.error('Note content element not found');
        if (!editBtn) console.error('Edit button not found');
        if (!saveBtn) console.error('Save button not found');
        if (!deleteBtn) console.error('Delete button not found');
    
        // Show Save button first if it's a new note
        if (isNew) {
            saveBtn.style.display = 'inline-block';
            editBtn.style.display = 'none';
            content.contentEditable = true;
        } else {
            saveBtn.style.display = 'none';
            editBtn.style.display = 'inline-block';
            content.contentEditable = false;
        }
    
        editBtn.addEventListener('click', function() {
            content.contentEditable = true;
            content.focus();
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
        });
    
        saveBtn.addEventListener('click', function() {
            content.contentEditable = false;
            saveBtn.style.display = 'none';
            editBtn.style.display = 'inline-block';
            saveNotes();
        });
    
        deleteBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this note?')) {
                noteElement.remove();
                saveNotes();
            }
        });
    
        content.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    
    function formatDateTime(date) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return date.toLocaleDateString('en-US', options);
    }
    
    function saveNotes() {
        const notes = [];
        document.querySelectorAll('.note').forEach(noteElement => {
            notes.push({
                id: noteElement.dataset.id,
                title: noteElement.querySelector('.note-title').textContent,
                content: noteElement.querySelector('.note-content').innerHTML,
                time: noteElement.querySelector('.note-time').textContent
            });
        });
        localStorage.setItem('nurseNotes', JSON.stringify(notes));
    }
    
    function loadNotes() {
        const savedNotes = localStorage.getItem('nurseNotes');
        if (savedNotes) {
            const notes = JSON.parse(savedNotes);
            notesList.innerHTML = ''; // Clear existing notes before loading
            notes.forEach(note => {
                const noteElement = document.createElement('div');
                noteElement.className = 'note';
                noteElement.dataset.id = note.id;
                noteElement.innerHTML = `
                    <div class="note-header">
                        <div class="note-title">${note.title}</div>
                        <div class="note-time">${note.time}</div>
                    </div>
                    <div class="note-content">${note.content}</div>
                    <div class="note-actions">
                        <button class="note-btn btn-save">Save</button>
                        <button class="note-btn btn-edit">Edit</button>
                        <button class="note-btn btn-delete">Delete</button>
                    </div>
                `;
                notesList.appendChild(noteElement);
                setupNoteEvents(noteElement);
                
                // Set the height based on content
                const content = noteElement.querySelector('.note-content');
                content.style.height = 'auto';
                content.style.height = (content.scrollHeight) + 'px';
            });
        } else {
            console.log('No saved notes found in storage');
        }
    }
    // Start the notes system
    initNotesSystem();
});