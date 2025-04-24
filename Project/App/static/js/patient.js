document.addEventListener('DOMContentLoaded', function () {
    //retrieve the patient data from sessionStorage
    const patientId = sessionStorage.getItem('data-patient-id');
    const patientName = sessionStorage.getItem('data-patient-name');
    const patientWard = sessionStorage.getItem('data-patient-ward');
    const patientStatus = sessionStorage.getItem('data-patient-status');

    const urlParams = new URLSearchParams(window.location.search);
    const patientIdParams = urlParams.get('id');
    fetch('/api/receive_data/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            patient_id: patientIdParams
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Response from server:', data);
        
        if (data.status === 'success') {
            const patient = data.patient_data;
            //--test
            console.log('Patient Birthday:', patient.birthday);
            console.log('Patient Phone Number:', patient.phone_number);
            console.log('Patient QR Code URL:', patient.qr_code);
            //vs1
            console.log('Allergies:', patient.allergies);
            console.log('Family History:', patient.family_history);
            console.log('Physical Exam:', patient.physical_exam);
            console.log('Diagnosis:', patient.diagnosis);
            //vs2
            console.log('Date/time:', patient.date_and_time);
            console.log('Temperature:', patient.temperature);
            console.log('BP:', patient.blood_pressure);
            console.log('Pulse:', patient.pulse);
            console.log('Respiration:', patient.respiratory);
            console.log('Oxygen Saturation:', patient.oxygen);
            //med
            console.log('Drug name:', patient.drug_name);
            console.log('Dose:', patient.dose);
            console.log('Units:', patient.units);
            console.log('Frequency:', patient.frequency);
            console.log('Route:', patient.route);
            console.log('Duration:', patient.duration);
            console.log('Quantity:', patient.quantity);
            console.log('Start Date:', patient.start_date);
            console.log('Status: ', patient.status);
            console.log('Diagnostic: ', patient.health_diagnostic);
            console.log('Pt instructions: ', patient.patient_instructions);
            console.log('Physician instruction: ', patient.pharmacist_instructions);
            //notes
            console.log('Notes:', patient.notes);
            console.log('Notes:', patient.nurse_id);

            //--

            document.getElementById('data-patient-id-view').textContent = patient.id;
            document.getElementById('data-patient-id-edit').value = patient.id;
    
            document.getElementById('data-patient-name-view').textContent = patient.name;
            document.getElementById('data-patient-name-edit').value = patient.name;
    
            document.getElementById('data-patient-sex-view').textContent = patient.sex;
            document.getElementById('data-patient-sex-edit').value = patient.sex;
    
            document.getElementById('data-patient-bday-view').textContent = "";
            document.getElementById('data-patient-bday-edit').value = "";
    
            document.getElementById('data-patient-phone-view').textContent = "";
            document.getElementById('data-patient-phone-edit').value = "";
    
            document.getElementById('data-patient-ward-view').textContent = patient.ward;
            document.getElementById('data-patient-ward-edit').value = patient.ward;
    
            document.getElementById('data-patient-status-view').textContent = patient.status;
            document.getElementById('data-patient-status-edit').value = patient.status;

    
            // Update other fields as necessary
        } else {
            alert('Error: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
    
    

    //display the patient data on the page
    if (document.getElementById('patient-id')) {
        document.getElementById('patient-id').textContent = patientId || 'N/A';
        document.getElementById('patient-name').textContent = patientName || 'N/A';
        document.getElementById('patient-ward').textContent = patientWard || 'N/A';
        document.getElementById('patient-status').textContent = patientStatus || 'N/A';
    }
    
    // console.log('patient id ', patientId);
    sessionStorage.clear(); //clear the sessionStorage after displaying the data

    //edit patient details
    const patientEditBtn = document.getElementById('edit-patient-btn');
    const patientSaveBtn = document.getElementById('save-patient-btn');
    const patientCancelBtn = document.getElementById('cancel-patient-btn');
    let phoneInputInstance = null;

    if (patientEditBtn && patientSaveBtn && patientCancelBtn) {
        patientEditBtn.addEventListener('click', function() {
            // Scope to patient tab only
            const patientTab = document.getElementById('patient');
            
            // Hide view and show edit elements in patient tab only
            patientTab.querySelectorAll('[id$="-view"]').forEach(el => el.classList.add('d-none'));
            patientTab.querySelectorAll('[id$="-edit"]').forEach(el => el.classList.remove('d-none'));

            // Phone input initialization
            const phoneEditInput = patientTab.querySelector('#data-patient-phone-edit');
            if (phoneEditInput) {
                if (phoneInputInstance) phoneInputInstance.destroy();
                
                phoneInputInstance = window.intlTelInput(phoneEditInput, {
                    initialCountry: "ph",
                    preferredCountries: ["ph", "us", "gb"],
                    separateDialCode: true,
                    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
                });
                
                const itiContainer = phoneEditInput.closest('.iti');
                if (itiContainer) {
                    itiContainer.classList.add('form-control', 'p-0');
                    itiContainer.style.display = 'block';
                }
            }

            // Toggle buttons
            patientEditBtn.classList.add('d-none');
            patientSaveBtn.classList.remove('d-none');
            patientCancelBtn.classList.remove('d-none');
        });

        patientSaveBtn.addEventListener('click', function() {
            const patientTab = document.getElementById('patient');
            
            // Get all edited values
            const editedName = patientTab.querySelector('#data-patient-name-edit').value;
            const editedSex = patientTab.querySelector('#data-patient-sex-edit').value;
            const editedBday = patientTab.querySelector('#data-patient-bday-edit').value;
            const editedWard = patientTab.querySelector('#data-patient-ward-edit').value;
            const editedStatus = patientTab.querySelector('#data-patient-status-edit').value;
            
            // Get phone number
            let editedPhone = '';
            if (phoneInputInstance) {
                editedPhone = phoneInputInstance.getNumber();
            } else {
                editedPhone = patientTab.querySelector('#data-patient-phone-edit').value;
            }
            
            // Update view spans
            patientTab.querySelector('#data-patient-name-view').textContent = editedName;
            patientTab.querySelector('#data-patient-sex-view').textContent = editedSex;
            patientTab.querySelector('#data-patient-bday-view').textContent = editedBday;
            patientTab.querySelector('#data-patient-phone-view').textContent = editedPhone;
            patientTab.querySelector('#data-patient-ward-view').textContent = editedWard;
            patientTab.querySelector('#data-patient-status-view').textContent = editedStatus;
            
            exitPatientEditMode();
        });
        
        patientCancelBtn.addEventListener('click', exitPatientEditMode);
        
        function exitPatientEditMode() {
            const patientTab = document.getElementById('patient');
            
            // Show view and hide edit elements
            patientTab.querySelectorAll('[id$="-view"]').forEach(el => el.classList.remove('d-none'));
            patientTab.querySelectorAll('[id$="-edit"]').forEach(el => el.classList.add('d-none'));
            
            // Toggle buttons
            patientEditBtn.classList.remove('d-none');
            patientSaveBtn.classList.add('d-none');
            patientCancelBtn.classList.add('d-none');
            
            // Clean up phone input
            if (phoneInputInstance) {
                phoneInputInstance.destroy();
                phoneInputInstance = null;
            }
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
    const vsEditBtn = document.getElementById('edit-vs-details-btn');
    const vsSaveBtn = document.getElementById('save-vs-details-btn');
    const vsCancelBtn = document.getElementById('cancel-vs-details-btn');
    let originalValues = {};

    if (vsEditBtn && vsSaveBtn && vsCancelBtn) {
        vsEditBtn.addEventListener('click', function() {
            // Scope to vitals tab only
            const vitalsTab = document.getElementById('vitals');
            
            // Store original values
            originalValues = {
                name: vitalsTab.querySelector('#data-patient-name-view').textContent,
                allergies: vitalsTab.querySelector('#data-patient-allergies-view').textContent,
                familyHistory: vitalsTab.querySelector('#data-patient-family-history-view').textContent,
                physicalExam: vitalsTab.querySelector('#data-patient-physical-exam-view').textContent,
                diagnosis: vitalsTab.querySelector('#data-patient-diagnosis-view').textContent
            };

            // Hide view and show edit elements in vitals tab only
            vitalsTab.querySelectorAll('[id$="-view"]').forEach(el => el.classList.add('d-none'));
            vitalsTab.querySelectorAll('[id$="-edit"]').forEach(el => {
                el.classList.remove('d-none');
                // Set readonly status
                if (el.id.includes('patient-id-edit')) {
                    el.readOnly = true;
                } else if (el.id.includes('data-patient-name-edit')) {
                    el.readOnly = true;
                } else {
                    el.readOnly = false;
                }
            });
            
            // Toggle buttons
            vsEditBtn.classList.add('d-none');
            vsSaveBtn.classList.remove('d-none');
            vsCancelBtn.classList.remove('d-none');
        });

        vsSaveBtn.addEventListener('click', function() {
            const vitalsTab = document.getElementById('vitals');
            
            // Update view with edited values
            vitalsTab.querySelector('#data-patient-name-view').textContent = 
                vitalsTab.querySelector('#data-patient-name-edit').value;   
            vitalsTab.querySelector('#data-patient-allergies-view').textContent = 
                vitalsTab.querySelector('#data-patient-allergies-edit').value;  
            vitalsTab.querySelector('#data-patient-family-history-view').textContent = 
                vitalsTab.querySelector('#data-patient-family-history-edit').value;   
            vitalsTab.querySelector('#data-patient-physical-exam-view').textContent = 
                vitalsTab.querySelector('#data-patient-physical-exam-edit').value;    
            vitalsTab.querySelector('#data-patient-diagnosis-view').textContent = 
                vitalsTab.querySelector('#data-patient-diagnosis-edit').value;

            // savePatientDetails();
            
            exitVsEditMode();
        });

        vsCancelBtn.addEventListener('click', function() {
            const vitalsTab = document.getElementById('vitals');
            
            // Restore original values
            vitalsTab.querySelector('#data-patient-name-edit').value = originalValues.name;
            vitalsTab.querySelector('#data-patient-allergies-edit').value = originalValues.allergies;
            vitalsTab.querySelector('#data-patient-family-history-edit').value = originalValues.familyHistory;
            vitalsTab.querySelector('#data-patient-physical-exam-edit').value = originalValues.physicalExam;
            vitalsTab.querySelector('#data-patient-diagnosis-edit').value = originalValues.diagnosis;
            
            exitVsEditMode();
        });

        function exitVsEditMode() {
            const vitalsTab = document.getElementById('vitals');
            
            // Show view and hide edit elements
            vitalsTab.querySelectorAll('[id$="-view"]').forEach(el => el.classList.remove('d-none'));
            vitalsTab.querySelectorAll('[id$="-edit"]').forEach(el => el.classList.add('d-none'));
            
            // Toggle buttons
            vsEditBtn.classList.remove('d-none');
            vsSaveBtn.classList.add('d-none');
            vsCancelBtn.classList.add('d-none');
        }
    }

    function savePatientDetails() {
        const vitalsTab = document.getElementById('vitals');
        const patientData = {
            name: vitalsTab.querySelector('#data-patient-name-edit').value,
            allergies: vitalsTab.querySelector('#data-patient-allergies-edit').value,
            family_history: vitalsTab.querySelector('#data-patient-family-history-edit').value,
            physical_exam: vitalsTab.querySelector('#data-patient-physical-exam-edit').value,
            diagnosis: vitalsTab.querySelector('#data-patient-diagnosis-edit').value
        };
        
        fetch('/api/patient/update/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
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

//Vitals TABLE
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

//Medication
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