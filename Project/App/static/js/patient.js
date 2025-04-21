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
    sessionStorage.clear(); //clear the sessionStorage after displaying the data
    //edit patient details
    const editBtn = document.getElementById('edit-patient-btn');
    const saveBtn = document.getElementById('save-patient-btn');
    const cancelBtn = document.getElementById('cancel-patient-btn');
    if (editBtn && saveBtn && cancelBtn) {
        editBtn.addEventListener('click', function() {
            // Hide all view spans and show edit inputs
            document.querySelectorAll('[id$="-view"]').forEach(el => el.classList.add('d-none'));
            document.querySelectorAll('[id$="-edit"]').forEach(el => el.classList.remove('d-none'));
            // Enable editing (except for ID which remains readonly)
            document.getElementById('data-patient-name-edit').readOnly = false;
            document.getElementById('data-patient-ward-edit').readOnly = false;
            document.getElementById('data-patient-status-edit').readOnly = false;
            // Toggle buttons
            editBtn.classList.add('d-none');
            saveBtn.classList.remove('d-none');
            cancelBtn.classList.remove('d-none');
        });
        saveBtn.addEventListener('click', function() {
            // Get edited values
            const editedName = document.getElementById('data-patient-name-edit').value;
            const editedWard = document.getElementById('data-patient-ward-edit').value;
            const editedStatus = document.getElementById('data-patient-status-edit').value;
            // Update view spans
            document.getElementById('data-patient-name-view').textContent = editedName;
            document.getElementById('data-patient-ward-view').textContent = editedWard;
            document.getElementById('data-patient-status-view').textContent = editedStatus;
            // Here you would typically send the updated data to your server
            // For example using fetch() or AJAX
            exitEditMode();
        });
        
        cancelBtn.addEventListener('click', function() {
            // Reset edit inputs to current values
            document.getElementById('data-patient-name-edit').value = document.getElementById('data-patient-name-view').textContent;
            document.getElementById('data-patient-ward-edit').value = document.getElementById('data-patient-ward-view').textContent;
            document.getElementById('data-patient-status-edit').value = document.getElementById('data-patient-status-view').textContent;
            
            exitEditMode();
        });
        
        function exitEditMode() {
            // Show all view spans and hide edit inputs
            document.querySelectorAll('[id$="-view"]').forEach(el => el.classList.remove('d-none'));
            document.querySelectorAll('[id$="-edit"]').forEach(el => el.classList.add('d-none'));
            
            // Toggle buttons
            editBtn.classList.remove('d-none');
            saveBtn.classList.add('d-none');
            cancelBtn.classList.add('d-none');
        }
    }


});

// PRINT SUMMARY BUTTON
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltip
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    // Print functionality
    document.getElementById('print-header').addEventListener('click', function() {
        //
    });
});

//edit patient vs details
document.addEventListener('DOMContentLoaded', function() {
    const editBtn = document.getElementById('edit-vs-details-btn');
    const saveBtn = document.getElementById('save-vs-details-btn');
    const cancelBtn = document.getElementById('cancel-vs-details-btn');
    // Store original values in case of cancel
    let originalValues = {};
    // Edit button click handler
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            // Store original values
            originalValues = {
                name: document.getElementById('data-patient-name-view').textContent,
                dob: document.getElementById('data-patient-dob-view').textContent,
                sex: document.getElementById('data-patient-sex-view').textContent,
                allergies: document.getElementById('data-patient-allergies-view').textContent,
                familyHistory: document.getElementById('data-patient-family-history-view').textContent,
                physicalExam: document.getElementById('data-patient-physical-exam-view').textContent,
                diagnosis: document.getElementById('data-patient-diagnosis-view').textContent
            };

            // Hide all view elements and show edit elements
            document.querySelectorAll('[id$="-view"]').forEach(el => el.classList.add('d-none'));
            document.querySelectorAll('[id$="-edit"]').forEach(el => {
                el.classList.remove('d-none');
                // Enable editing (except for ID which should remain readonly)
                if (!el.id.includes('patient-id-edit')) {
                    el.readOnly = false;
                }
            });
            // Toggle buttons
            editBtn.classList.add('d-none');
            saveBtn.classList.remove('d-none');
            cancelBtn.classList.remove('d-none');
        });
    }
    // Save button click handler
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            // Update view elements with edited values
            document.getElementById('data-patient-name-view').textContent = 
                document.getElementById('data-patient-name-edit').value;
            
            document.getElementById('data-patient-dob-view').textContent = 
                formatDate(document.getElementById('data-patient-dob-edit').value);
            
            const sexSelect = document.getElementById('data-patient-sex-edit');
            document.getElementById('data-patient-sex-view').textContent = 
                sexSelect.options[sexSelect.selectedIndex].text;
            
            document.getElementById('data-patient-allergies-view').textContent = 
                document.getElementById('data-patient-allergies-edit').value;
            
            document.getElementById('data-patient-family-history-view').textContent = 
                document.getElementById('data-patient-family-history-edit').value;
            
            document.getElementById('data-patient-physical-exam-view').textContent = 
                document.getElementById('data-patient-physical-exam-edit').value;
            
            document.getElementById('data-patient-diagnosis-view').textContent = 
                document.getElementById('data-patient-diagnosis-edit').value;

            // savePatientDetails();

            exitEditMode();
        });
    }

    // Cancel button click handler
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            // Restore original values
            document.getElementById('data-patient-name-edit').value = originalValues.name;
            document.getElementById('data-patient-dob-edit').value = formatDateForInput(originalValues.dob);
            
            // Set the sex select to the original value
            const sexSelect = document.getElementById('data-patient-sex-edit');
            for (let i = 0; i < sexSelect.options.length; i++) {
                if (sexSelect.options[i].text === originalValues.sex) {
                    sexSelect.selectedIndex = i;
                    break;
                }
            }
            
            document.getElementById('data-patient-allergies-edit').value = originalValues.allergies;
            document.getElementById('data-patient-family-history-edit').value = originalValues.familyHistory;
            document.getElementById('data-patient-physical-exam-edit').value = originalValues.physicalExam;
            document.getElementById('data-patient-diagnosis-edit').value = originalValues.diagnosis;

            // Exit edit mode
            exitEditMode();
        });
    }
    // Function to exit edit mode
    function exitEditMode() {
        // Show all view elements and hide edit elements
        document.querySelectorAll('[id$="-view"]').forEach(el => el.classList.remove('d-none'));
        document.querySelectorAll('[id$="-edit"]').forEach(el => el.classList.add('d-none'));
        // Toggle buttons
        editBtn.classList.remove('d-none');
        saveBtn.classList.add('d-none');
        cancelBtn.classList.add('d-none');
    }
    // Helper function to format date for display
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    // Helper function to format date for input[type="date"]
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    //save function 
    function savePatientDetails() {
        const patientData = {
            name: document.getElementById('data-patient-name-edit').value,
            dob: document.getElementById('data-patient-dob-edit').value,
            sex: document.getElementById('data-patient-sex-edit').value,
            allergies: document.getElementById('data-patient-allergies-edit').value,
            family_history: document.getElementById('data-patient-family-history-edit').value,
            physical_exam: document.getElementById('data-patient-physical-exam-edit').value,
            diagnosis: document.getElementById('data-patient-diagnosis-edit').value
        };
        fetch('/api/patient/update/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') // For Django CSRF protection
            },
            body: JSON.stringify(patientData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Patient details updated successfully');
            } else {
                console.error('Failed to update patient details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
});

//VS TABLE
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap Table
    $('#vitals-table').bootstrapTable();
    // Variables to track selected row
    let selectedVitalsId = null;
    // Row selection handler
    $('#vitals-table').on('click-row.bs.table', function(e, row, $element) {
        // Remove highlight from all rows
        $('#vitals-table tbody tr').removeClass('table-primary');
        // Highlight selected row
        $element.addClass('table-primary');
        // Enable edit/delete buttons
        $('#edit-vitals-btn').prop('disabled', false);
        $('#delete-vitals-btn').prop('disabled', false);
        // Store selected vitals ID
        selectedVitalsId = $element.attr('data-vitals-id');
    });
    // Edit button handler
    $('#edit-vitals-btn').click(function() {
       });
    // Add new button handler
    $('#add-vitals-btn').click(function() {
    });
    // Delete button handler
    $('#delete-vitals-btn').click(function() {
    });

});

//MED
document.addEventListener('DOMContentLoaded', function() {
    new DataTable('#active');
    new DataTable('#inactive');
    
    // Future functionality to be added here:
    // - Form submission handling
    // - Drug order table interactions
    // - Edit/delete functionality
    // - Status toggling
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