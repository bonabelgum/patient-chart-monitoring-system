let schedule_end_time = null
let isPasswordValid = false;
let editCondition = false
let newlyAddedMedications = [];  // Stores newly added unsaved rows
let selectedDrugData = {};
let medicationId = null;

window.addEventListener('pageshow', function (event) {
    if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
        location.reload();
    }
});

document.querySelector('input[type="password"]').setAttribute('autocomplete', 'new-password');


document.addEventListener('DOMContentLoaded', function () {
    //retrieve the patient data from sessionStorage
    const patientId = sessionStorage.getItem('data-patient-id');
    const patientName = sessionStorage.getItem('data-patient-name');
    const patientNumber = sessionStorage.getItem('data-patient-number');
    const patientWard = sessionStorage.getItem('data-patient-ward');
    const patientStatus = sessionStorage.getItem('data-patient-status');
    const physicianName= sessionStorage.getItem('data-physician-name-view');

    const urlParams = new URLSearchParams(window.location.search);
    // const patientIdParams = urlParams.get('id');
    const pathParts = window.location.pathname.split('/');
    const patientIdParams = pathParts[2];  // "11" from /patient/11/
    const schedule_end_time = urlParams.get('end_time');
    console.log(schedule_end_time);

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
            //POPULATE
            const patient = data.patient_data;
            
            /*--test---
            console.log('Patient Birthday:', patient.birthday);
            console.log('Patient Phone Number:', patient.phone_number);
            console.log('Patient QR Code URL:', patient.qr_code);
            console.log('Attending physician:', patient.physician_name);
            //vs1
            console.log('Allergies:', patient.allergies);
            console.log('Family History:', patient.family_history);
            console.log('Physical Exam:', patient.physical_exam);
            console.log('Diagnosis:', patient.diagnosis);
            //vs2
            /*console.log('Date/time:', patient.date_and_time);
            console.log('Temperature:', patient.temperature);
            console.log('BP:', patient.blood_pressure);
            console.log('Pulse:', patient.pulse);
            console.log('Respiration:', patient.respiratory);
            console.log('Oxygen Saturation:', patient.oxygen);*
            console.log('VS: ', data.vitals_data);
            //med
            const medLogs = data.med_logs || []; 
            console.log('Medication Logs:', medLogs);
            /*
            console.log('Meds: ', data.med_data);
            //notes
            console.log('notes: ', data.notes_data);*/
            //--end of test--

            //--tab1--
            // POPULATE QR CODE
            const qrCodeImg = document.getElementById('patient-qr-code');
            if (data.patient_data.qr_code) {
                qrCodeImg.src = data.patient_data.qr_code;
                qrCodeImg.style.display = 'block';
            } else {
                qrCodeImg.style.display = 'none';
                console.warn('No QR code available for this patient');
            }

            document.getElementById('data-patient-id-view').textContent = patient.id;
            document.getElementById('data-patient-id-edit').value = patient.id;
    
            document.getElementById('data-patient-name-view').textContent = patient.name;
            document.getElementById('data-patient-name-edit').value = patient.name;
    
            document.getElementById('data-patient-sex-view').textContent = patient.sex;
            document.getElementById('data-patient-sex-edit').value = patient.sex;
    
            document.getElementById('data-patient-bday-view').textContent = patient.birthday;
            document.getElementById('data-patient-bday-edit').value = patient.birthday;

            document.getElementById('data-patient-weight-view').textContent = patient.weight;
            document.getElementById('data-patient-weight-edit').value = patient.weight;

            document.getElementById('data-patient-height-view').textContent = patient.height;
            document.getElementById('data-patient-height-edit').value = patient.height;
    
            document.getElementById('data-patient-phone-view').textContent = patient.phone_number;
            document.getElementById('data-patient-phone-edit').value = patient.phone_number;

            document.getElementById('data-patient-number-view').textContent = patient.number;
            document.getElementById('data-patient-number-edit').value = patient.number;
    
            document.getElementById('data-patient-ward-view').textContent = patient.ward;
            document.getElementById('data-patient-ward-edit').value = patient.ward;
    
            document.getElementById('data-patient-status-view').textContent = patient.pt_status;
            document.getElementById('data-patient-status-edit').value = patient.pt_status;

            document.getElementById('data-physician-name-view').textContent = patient.physician_name;
            document.getElementById('data-patient-physician-edit').value = patient.physician_name;
            //--end of tab1--
            
            //--tab2--

            document.getElementById('data-patient-name-view1').textContent = patient.name;
            document.getElementById('data-patient-name-edit1').value = patient.name;

            document.getElementById('data-patient-allergies-view').textContent = patient.allergies;
            document.getElementById('data-patient-allergies-edit').value = patient.allergies;

            document.getElementById('data-patient-family-history-view').textContent = patient.family_history;
            document.getElementById('data-patient-family-history-edit').value = patient.family_history;

            document.getElementById('data-patient-physical-exam-view').textContent = patient.physical_exam;
            document.getElementById('data-patient-physical-exam-edit').value = patient.physical_exam;

            document.getElementById('data-patient-diagnosis-view').textContent = patient.diagnosis
            document.getElementById('data-patient-diagnosis-edit').value = patient.diagnosis;
            // data-patient-reason-edit
            // data-patient-password-edit1

            

            // ----VITALS TABLE -----
            if (data.vitals_data) {
                //console.log('Raw VS Data:', data.vitals_data);
                // 1. Transform data
                const tableData = data.vitals_data.map(vs => ({
                    datetime: vs.datetime || vs.date_and_time || '',
                    temperature: vs.temperature || vs.temp || '',
                    blood_pressure: vs.blood_pressure || vs.bp || '',
                    pulse: vs.pulse || vs.pulse_rate || '',
                    respiratory: vs.respiratory || vs.respiratory_rate || '',
                    oxygen: vs.oxygen || vs.oxygen_saturation || '',
                    remarks: vs.remarks || vs.remarks || '',
                    id: vs.id || Date.now() + Math.random() // ensure unique ID
                }));
                console.log('Processed Table Data:', tableData);
                // 2. Clear existing server-rendered rows
                $('#vitals-table tbody').empty();
                // 3. Initialize or refresh table
                if ($('#vitals-table').data('bootstrap.table')) {
                    $('#vitals-table').bootstrapTable('load', tableData);
                } else {
                    $('#vitals-table').bootstrapTable({
                        data: tableData,
                        columns: [
                            { field: 'datetime', title: 'Date and time', sortable: true },
                            { field: 'temperature', title: 'Temperature', sortable: true },
                            { field: 'blood_pressure', title: 'Blood pressure', sortable: true },
                            { field: 'pulse', title: 'Pulse rate', sortable: true },
                            { field: 'respiratory', title: 'Respiratory rate', sortable: true },
                            { field: 'oxygen', title: 'Oxygen saturation', sortable: true },
                            { field: 'remarks', title: 'Remarks', sortable: true }
                        ],
                        loadingTemplate: function() {
                            return ''; // This removes the loading message
                        }
                    });
                }
                // 4. Add row click handler to populate modal
                $('#vitals-table').on('click-row.bs.table', function(e, row, $element) {
                    // Highlight the selected row
                    $('#vitals-table tbody tr').removeClass('table-primary');
                    $element.addClass('table-primary');
                    // Store the selected row ID
                    window.selectedVitalsId = row.id;
                    // Populate the modal with the row data
                    populateVitalsModal(row);
                    // Show the modal
                    const editModal = new bootstrap.Modal(document.getElementById('editVitalsModal'));
                    editModal.show();
                });
                // Function to populate modal with row data
                // Edit Vital Sign
                function populateVitalsModal(row) {
                    // Fill the form fields
                    $('#edit-vs-temperature').val(row.temperature || '');
                    $('#edit-vs-bp').val(row.blood_pressure || '');
                    $('#edit-vs-pulse').val(row.pulse || '');
                    $('#edit-vs-respiratory').val(row.respiratory || '');
                    $('#edit-vs-oxygen').val(row.oxygen || '');
                    $('#edit-vs-remarks').val(row.remarks || '');
                    // Clear reason and password fields
                    $('#edit-vs-reason').val('');
                    $('#edit-vs-password').val('');
                    document.getElementById('edit-vs-submit').addEventListener('click', function() {
                        const vitalSignsData = {
                            temperature: $('#edit-vs-temperature').val(),
                            blood_pressure: $('#edit-vs-bp').val(),
                            pulse: $('#edit-vs-pulse').val(),
                            respiratory: $('#edit-vs-respiratory').val(),
                            oxygen: $('#edit-vs-oxygen').val(),
                            remarks: $('#edit-vs-remarks').val(),
                            reason: $('#edit-vs-reason').val(),
                            password: $('#edit-vs-password').val(),
                            id: row.id
                        };
                    
                    
                        // console.log('Sending data:', row.id);
                        fetch('/api/update_vital_signs/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken,  // Make sure csrfToken is available
                            },
                            body: JSON.stringify(vitalSignsData)
                        })
                        .then(response => response.json())
                        .then(data => {
                            // console.log('Response from server:', data);
                            
                            
                            if(data.status == 'failed'){
                                alert(data.message);
                            }else{
                                console.log('Response from server:', data);
                                const modal = bootstrap.Modal.getInstance(document.getElementById('editVitalsModal'));
                                modal.hide();
                                // Now update the row manually
                                row.temperature = vitalSignsData.temperature;
                                row.blood_pressure = vitalSignsData.blood_pressure;
                                row.pulse = vitalSignsData.pulse;
                                row.respiratory = vitalSignsData.respiratory;
                                row.oxygen = vitalSignsData.oxygen;
                                row.remarks = vitalSignsData.remarks;

                                // Then update the table
                                $('#vitals-table').bootstrapTable('updateByUniqueId', {
                                    id: row.id,
                                    row: row
                                });
                                alert('Vital Signs Saved');
                            }

                            
                            // alert('Data sent successfully!');
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Error sending data.');
                        });
                    });
                    
                }
                // Helper function to format datetime for input[type=datetime-local]
                function formatDateTimeForInput(datetimeString) {
                    if (!datetimeString) return '';
                    // Create a Date object from the string
                    const date = new Date(datetimeString);
                    // Format as YYYY-MM-DDTHH:MM
                    const pad = num => num.toString().padStart(2, '0');    
                    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
                }   
            } else {
                console.warn('No vitals data received');
                $('#vitals-table').bootstrapTable(); // Initialize empty table
            }
            // ---- END OF VITALS TABLE SECTION ----
            //--end of tab2--

            //--tab3--
            document.getElementById('data-patient-name-view2').textContent = patient.name;
            document.getElementById('data-patient-name-edit2').value = patient.name;

            // Initialize DataTables and store references to them
            const activeTable = new DataTable('#active');
            const inactiveTable = new DataTable('#inactive');

            //--med table--
            // medication populate
            if (data.med_data) {
                // Clear existing data first
                activeTable.clear();
                inactiveTable.clear();
                // Process each medication record
                data.med_data.forEach(drug => {
                    // Create the row data array
                    const rowValues = [
                        drug.drug_name || '',
                        drug.dose || '',
                        drug.units || '',
                        drug.frequency || '',
                        drug.quantity || '',
                        drug.route || '',
                        drug.duration || '',
                        drug.start_date || '',
                        drug.end_date || ''
                    ];
            
                    // Add to appropriate table based on status
                    if (drug.status && drug.status.toLowerCase() === 'active') {
                        const rowNode = activeTable.row.add(rowValues).draw().node();
                        $(rowNode).data('fullDrugData', drug); // Attach full drug data
                    } else {
                        const rowNode = inactiveTable.row.add(rowValues).draw().node();
                        $(rowNode).data('fullDrugData', drug); // Attach full drug data
                    }
                });
            } else {
                console.warn('No med_data found in response');
            }
            //--end of med table--
            //--end of tab3--

            //--tab4--
            // Populate Nurse
            document.getElementById('data-patient-name-view3').textContent = patient.name;
            document.getElementById('data-patient-name-edit3').value = patient.name;
            
            //memo
            //Initialize variables at the top level
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
            // Start the notes system
            initNotesSystem();
            //memo

            //--end of tab4--

            window.medData = data.med_data;
            window.vitalsData = data.vitals_data;

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
        document.getElementById('patient-number').textContent = patientNumber || 'N/A';
        document.getElementById('patient-ward').textContent = patientWard || 'N/A';
        document.getElementById('patient-status').textContent = patientStatus || 'N/A';
        document.getElementById('physician-name').textContent = physicianName || 'N/A';
    }
    
    // console.log('patient id ', patientId);
    //sessionStorage.clear(); //clear the sessionStorage after displaying the data

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

            patientTab.querySelectorAll('.reason-field').forEach(el => el.classList.remove('d-none'));
            patientTab.querySelectorAll('.password-field').forEach(el => el.classList.remove('d-none'));

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

            const form = patientTab.querySelector('#patient-info');

            form.classList.remove('was-validated');

            // Toggle buttons
            patientEditBtn.classList.add('d-none');
            patientSaveBtn.classList.remove('d-none');
            patientCancelBtn.classList.remove('d-none');
        });

        patientSaveBtn.addEventListener('click', function() {
            
            const patientTab = document.getElementById('patient');
            const reasonInput = patientTab.querySelector('#data-patient-reason-edit');
            const passwordInput = patientTab.querySelector('#data-patient-password-edit');
            let isValid = true;
        
            // 1. VALIDATION - Check required fields
            if (!reasonInput.value.trim()) {
                reasonInput.classList.add('is-invalid');
                passwordInput.classList.add('is-invalid');
                isValid = false;
            } else {
                reasonInput.classList.remove('is-invalid');
                passwordInput.classList.remove('is-invalid');
            }
            if (!passwordInput.value.trim()) {
                passwordInput.classList.add('is-invalid');
                isValid = false;
            } else {
                passwordInput.classList.remove('is-invalid');
            }
        
            // Stop if validation fails
            if (!isValid) {
                return;
            }
        
            // 2. GET VALUES - Your existing value collection
            
            const editedPatientId = patientTab.querySelector('#data-patient-id-view').textContent;
            const editedName = patientTab.querySelector('#data-patient-name-edit').value;
            const editedSex = patientTab.querySelector('#data-patient-sex-edit').value;
            const editedBday = patientTab.querySelector('#data-patient-bday-edit').value;
            const editedWeight = patientTab.querySelector('#data-patient-weight-edit').value;
            const editedHeight = patientTab.querySelector('#data-patient-height-edit').value;
            const editedNumber = patientTab.querySelector('#data-patient-number-edit').value;
            const editedWard = patientTab.querySelector('#data-patient-ward-edit').value;
            const editedStatus = patientTab.querySelector('#data-patient-status-edit').value;
            const editedPhysician = patientTab.querySelector('#data-patient-physician-edit').value;
            const editedReason = reasonInput.value;
            const editedPassword = passwordInput.value;
            
            // Phone number handling
            let editedPhone = '';
            if (phoneInputInstance) {
                editedPhone = phoneInputInstance.getNumber();
            } else {
                editedPhone = patientTab.querySelector('#data-patient-phone-edit').value;
            }
            
            
            // Save Edited Patient Details to db
            const patientData = {
                patientId: editedPatientId,
                editedName: editedName,
                editedSex: editedSex,
                editedBday: editedBday,
                editedWeight: editedWeight,
                editedHeight: editedHeight,
                editedNumber: editedNumber,
                editedWard: editedWard,
                editedStatus: editedStatus,
                editedPhysician: editedPhysician,
                editedReason: editedReason,
                editedPhone: editedPhone,
                editedPassword: editedPassword
            };
            
            // Make the POST request
            fetch('/api/update_patient/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify(patientData)
            })
            .then(async response => {
                const data = await response.json();
                
                if (response.ok) {
                    // HTTP 200-299
                    if (data.status === 'success') {
                        // 3. UPDATE VIEW - Your existing view updates
                        patientTab.querySelector('#data-patient-name-view').textContent = editedName;
                        patientTab.querySelector('#data-patient-sex-view').textContent = editedSex;
                        patientTab.querySelector('#data-patient-bday-view').textContent = editedBday;
                        patientTab.querySelector('#data-patient-weight-view').textContent = editedWeight;
                        patientTab.querySelector('#data-patient-height-view').textContent = editedHeight;
                        patientTab.querySelector('#data-patient-phone-view').textContent = editedPhone;
                        patientTab.querySelector('#data-patient-number-view').textContent = editedNumber;
                        patientTab.querySelector('#data-patient-ward-view').textContent = editedWard;
                        patientTab.querySelector('#data-patient-status-view').textContent = editedStatus;
                        patientTab.querySelector('#data-physician-name-view').textContent = editedPhysician;
                        patientTab.querySelector('#data-patient-reason-view').textContent = editedReason;
                        patientTab.querySelector('#data-patient-password-view').textContent = editedPassword;
                    
                        // 4. CLEAR & EXIT
                        reasonInput.value = ''; // Clear the reason field
                        passwordInput.value = '';
                        exitPatientEditMode();
                        alert('Patient information updated successfully!');
                    } else {
                        console.error('Update failed:', data.message, data.errors);
                        let errorMessages = '';
            
                        if (data.errors) {
                            for (let field in data.errors) {
                                errorMessages += `${field}: ${data.errors[field].join(', ')}\n`;
                            }
                        } else {
                            errorMessages = data.message;
                        }
            
                        alert('Please check your Shift Password:\n' + errorMessages);
                    }
                } else {
                    // HTTP 400, 404, 500, etc.
                    console.error('Server returned error:', data.message, data.errors);
                    let errorMessages = '';
            
                    if (data.errors) {
                        for (let field in data.errors) {
                            errorMessages += `${field}: ${data.errors[field].join(', ')}\n`;
                        }
                    } else {
                        errorMessages = data.message || 'Unknown error';
                    }
            
                    alert('Server error while updating patient:\n' + errorMessages);
                }
            })
            .catch(error => {
                console.error('Network error:', error);
                alert('Network error while updating patient');
            });
            
        
            
        });
        
        patientCancelBtn.addEventListener('click', exitPatientEditMode);
        
        function exitPatientEditMode() {
            const patientTab = document.getElementById('patient');

            const passwordInput = patientTab.querySelector('#data-patient-password-edit');
            if (passwordInput) {
                passwordInput.value = ''; // Clear the password
            }
            
            // Show view and hide edit elements
            patientTab.querySelectorAll('[id$="-view"]').forEach(el => el.classList.remove('d-none'));
            patientTab.querySelectorAll('[id$="-edit"]').forEach(el => el.classList.add('d-none'));
            patientTab.querySelectorAll('.reason-field').forEach(el => el.classList.add('d-none'));
            patientTab.querySelectorAll('.password-field').forEach(el => el.classList.add('d-none'));
            
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

//print qr
document.getElementById('print-qr-btn').addEventListener('click', function() {
    // Get patient data from the HTML elements
    const patientId = document.getElementById('data-patient-id-view').textContent;
    const patientName = document.getElementById('data-patient-name-view').textContent;
    const patientBirthday = document.getElementById('data-patient-bday-view').textContent;
    const patientWard = document.getElementById('data-patient-ward-view').textContent;
    
    // Get the QR code image source
    const qrCodeSrc = document.getElementById('patient-qr-code').src;
    
    // Debug: Check what values we're getting
    /*console.log('Patient Data:', {
        id: patientId,
        name: patientName,
        birthday: patientBirthday,
        ward: patientWard,
        qrCode: qrCodeSrc
    });*/
    
    // Populate the printable content
    document.getElementById('print-id').textContent = patientId;
    document.getElementById('print-name').textContent = patientName;
    document.getElementById('print-bday').textContent = patientBirthday;
    document.getElementById('print-ward').textContent = patientWard;
    document.getElementById('print-qr').src = qrCodeSrc;
    
    // Show the printable content (temporarily)
    const printableContent = document.getElementById('printable-wristband');
    printableContent.style.display = 'block';
    
    // Print the content
    window.print();
    
    // Hide it again after printing
    printableContent.style.display = 'none';
});

// PRINT SUMMARY BUTTON
document.getElementById('print-header').addEventListener('click', function() {
    // Get patient data from view elements
    const patientId = document.getElementById('data-patient-id-view').textContent;
    const patientName = document.getElementById('data-patient-name-view').textContent;
    const patientSex = document.getElementById('data-patient-sex-view').textContent;
    const patientBday = document.getElementById('data-patient-bday-view').textContent;
    const patientPhone = document.getElementById('data-patient-phone-view').textContent;
    const physician = document.getElementById('data-physician-name-view').textContent;
    const allergies = document.getElementById('data-patient-allergies-view').textContent;
    const familyHistory = document.getElementById('data-patient-family-history-view').textContent;
    const physicalExam = document.getElementById('data-patient-physical-exam-view').textContent;
    const diagnosis = document.getElementById('data-patient-diagnosis-view').textContent;
    
    // Get current date
    const today = new Date();
    document.getElementById('print-date').textContent = today.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Populate patient info
    document.getElementById('print-id1').textContent = patientId;
    document.getElementById('print-name1').textContent = patientName;
    document.getElementById('print-sex').textContent = patientSex;
    document.getElementById('print-bday1').textContent = patientBday;
    document.getElementById('print-phone').textContent = patientPhone;
    document.getElementById('print-physician').textContent = physician;
    document.getElementById('print-allergies').textContent = allergies || 'None recorded';
    document.getElementById('print-family-history').textContent = familyHistory || 'None recorded';
    document.getElementById('print-physical-exam').textContent = physicalExam || 'Not documented';
    document.getElementById('print-diagnosis').textContent = diagnosis || 'Pending diagnosis';
    
    
    
    // Populate vitals table
    const vitalsTable = document.getElementById('print-vitals-table').getElementsByTagName('tbody')[0];
    vitalsTable.innerHTML = ''; // Clear existing rows
    
    if (window.vitalsData && window.vitalsData.length > 0) {
        window.vitalsData.forEach(vs => {
            const row = vitalsTable.insertRow();
            row.innerHTML = `
                <td style="padding: 8px; border: 1px solid #ddd;">${vs.datetime || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${vs.temperature || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${vs.blood_pressure || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${vs.pulse || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${vs.respiratory || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${vs.oxygen || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${vs.remarks || ''}</td>
            `;
        });
    } else {
        vitalsTable.innerHTML = '<tr><td colspan="6" style="padding: 8px; text-align: center; border: 1px solid #ddd;">No vital signs recorded</td></tr>';
    }

    // Populate medications table
    const medsTable = document.getElementById('print-meds-table').getElementsByTagName('tbody')[0];
    medsTable.innerHTML = ''; // Clear existing rows
    
    if (window.medData && window.medData.length > 0) {
        window.medData.forEach(drug => {
            const row = medsTable.insertRow();
            row.innerHTML = `
                <td style="padding: 8px; border: 1px solid #ddd;">${drug.drug_name || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${drug.dose || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${drug.units || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${drug.frequency || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${drug.route || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${drug.quantity || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${drug.status || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${drug.start_date || ''}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${drug.end_date || ''}</td>
            `;
        });
    } else {
        medsTable.innerHTML = '<tr><td colspan="6" style="padding: 8px; text-align: center; border: 1px solid #ddd;">No medications prescribed</td></tr>';
    }
    


    //print med logs
    fetch('/api/receive_data/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ patient_id: patientId })
    })
        .then(response => response.json())
        .then(data => {
            // Med logs
            const medsLogsTableBody = document.querySelector('#print-meds-logs-table tbody');
            medsLogsTableBody.innerHTML = '';
            if (data.med_logs?.length > 0) {
                const groupedLogs = data.med_logs.reduce((acc, log) => {
                    const drug = log.drug_name || '[Not specified]';
                    acc[drug] = acc[drug] || [];
                    acc[drug].push(log);
                    return acc;
                }, {});
                Object.keys(groupedLogs).forEach(drug => {
                    groupedLogs[drug].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
                    groupedLogs[drug].forEach(log => {
                        const row = document.createElement('tr');
                        console.log("ers "+log.remarks);
                        row.innerHTML = `
                            <td style="padding:8px; border:1px solid #ddd;">${log.drug_name}</td>
                            <td style="padding:8px; border:1px solid #ddd;">${log.datetime}</td>
                            <td style="padding:8px; border:1px solid #ddd;">${log.administered_by || 'N/A'}</td>
                            <td style="padding:8px; border:1px solid #ddd;">${log.status}</td>
                            <td style="padding:8px; border:1px solid #ddd;">${log.remarks || 'N/A'}</td>
                        `;
                        medsLogsTableBody.appendChild(row);
                    });
                });
            } else {
                medsLogsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No medication logs found</td></tr>';
            }
        })
        .catch(error => {
            alert('Error fetching data for printing: ' + error.message);
        });

    //print nurse notes
    fetch('/api/receive_data/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ patient_id: patientId })
    })
        .then(response => response.json())
        .then(data => {
            
            // Nurse notes
            const notesContainer = document.getElementById('print-notes-container');
            notesContainer.innerHTML = '';
            if (data.notes_data?.length > 0) {
                data.notes_data.forEach(note => {
                    const noteElement = document.createElement('div');
                    noteElement.style.marginBottom = '30px';
                    noteElement.style.borderBottom = '1px solid #eee';
                    noteElement.style.paddingBottom = '15px';

                    const dateElement = document.createElement('div');
                    dateElement.style.fontWeight = 'bold';
                    dateElement.style.marginBottom = '8px';
                    dateElement.style.color = '#555';
                    const noteDate = new Date(note.date);
                    dateElement.textContent = noteDate.toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) + ` • Nurse ID: ${note.nurse_id}`;

                    const contentElement = document.createElement('div');
                    contentElement.style.whiteSpace = 'pre-wrap';
                    contentElement.style.padding = '10px';
                    contentElement.style.backgroundColor = '#f8f9fa';
                    contentElement.style.borderRadius = '4px';
                    contentElement.textContent = note.notes || '';

                    noteElement.appendChild(dateElement);
                    noteElement.appendChild(contentElement);
                    notesContainer.appendChild(noteElement);
                });
            } else {
                notesContainer.innerHTML = '<div style="text-align: center; color: #666; font-style: italic;">No nursing notes recorded</div>';
            }

            // Final print action
            const printableContent = document.getElementById('printable-patient-chart');
            printableContent.style.display = 'block';
            window.print();
            printableContent.style.display = 'none';
        })
        .catch(error => {
            alert('Error fetching data for printing: ' + error.message);
        });
    
    fetch('/api/save_snapshot/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ patient_id: patientId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // console.log('Snapshot saved! ID: ' + data.snapshot_id + ' | Control #: ' + data.control_number);
                document.getElementById('print-date').textContent = new Date(data.created_at).toLocaleString();
                document.getElementById('print-snapshot-version').textContent = data.control_number || 'N/A';

            } else {
            console.error('Save failed:', data.error);
            }
        })
        .catch(error => {
            console.error('Request error:', error);
        });

    
    //print nurse logs

    // Show and print
    /*const printableContent = document.getElementById('printable-patient-chart');
    printableContent.style.display = 'block';
    window.print();
    printableContent.style.display = 'none';*/
});
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
/*print med logs
document.getElementById('print-medication-logs').addEventListener('click', function() {
    // Get patient data from view elements
    const patientId = document.getElementById('data-patient-id-view').textContent;
    const patientName = document.getElementById('data-patient-name-view').textContent;
    const patientBday = document.getElementById('data-patient-bday-view').textContent;
    const physician = document.getElementById('data-physician-name-view').textContent;
    
    // Get current date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Fetch medication logs data
    fetch('/api/receive_data/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') // Use the getCookie function instead
        },
        body: JSON.stringify({
            patient_id: patientId
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('API response data:', data); // Debug log

        if (data.status === 'success') {
            // Populate patient info in the printable section
            document.getElementById('meds-print-date').textContent = formattedDate;
            document.getElementById('meds-print-id').textContent = patientId;
            document.getElementById('meds-print-name').textContent = patientName;
            document.getElementById('meds-print-bday').textContent = patientBday;
            document.getElementById('meds-print-physician').textContent = physician;

            // Get the table body element
            const tbody = document.querySelector('#print-meds-logs-table tbody');
            tbody.innerHTML = ''; // Clear any existing rows

            // Group medication logs by drug_name
            const groupedLogs = data.med_logs.reduce((acc, log) => {
                const drugName = log.drug_name || '[Not specified]';
                if (!acc[drugName]) {
                    acc[drugName] = [];
                }
                acc[drugName].push(log);
                return acc;
            }, {});

            // Log the grouped logs for debugging
            console.log('Grouped Medication Logs:', groupedLogs);

            // Iterate over the grouped logs and sort by datetime
            Object.keys(groupedLogs).forEach(drugName => {
                const logs = groupedLogs[drugName];
                
                // Sort logs for each drug by datetime in descending order
                logs.sort((a, b) => {
                    // Convert the datetime strings to Date objects for comparison
                    const dateA = new Date(a.datetime);
                    const dateB = new Date(b.datetime);
                    return dateB - dateA;  // Sorting in descending order (newest first)
                });

                // Log the sorted logs for debugging
                console.log(`Sorted logs for drug: ${drugName}`, logs);

                // Add rows for each medication log
                logs.forEach(log => {
                    const row = document.createElement('tr');
                    row.style.borderBottom = '1px solid #ddd';
                    
                    const drugNameCell = document.createElement('td');
                    drugNameCell.style.padding = '8px';
                    drugNameCell.style.border = '1px solid #ddd';
                    drugNameCell.textContent = log.drug_name || '[Not specified]';
                    
                    const dateCell = document.createElement('td');
                    dateCell.style.padding = '8px';
                    dateCell.style.border = '1px solid #ddd';
                    dateCell.textContent = log.datetime;
                    
                    const adminCell = document.createElement('td');
                    adminCell.style.padding = '8px';
                    adminCell.style.border = '1px solid #ddd';
                    adminCell.textContent = log.administered_by || 'N/A';
                    
                    const statusCell = document.createElement('td');
                    statusCell.style.padding = '8px';
                    statusCell.style.border = '1px solid #ddd';
                    statusCell.textContent = log.status;

                    const remarkCell = document.createElement('td');
                    remarkCell.style.padding = '8px';
                    remarkCell.style.border = '1px solid #ddd';
                    remarkCell.textContent = log.remarks || 'N/A';
                    
                    row.appendChild(drugNameCell);
                    row.appendChild(dateCell);
                    row.appendChild(adminCell);
                    row.appendChild(statusCell);
                    row.appendChild(remarkCell);
                    
                    tbody.appendChild(row);
                });
            });

            // Show the printable content
            const printableContent = document.getElementById('printable-medication-logs');
            printableContent.style.display = 'block';
            
            // Add print-specific styles (similar to nurse notes)
            const style = document.createElement('style');
            style.innerHTML = `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-medication-logs, #printable-medication-logs * {
                        visibility: visible;
                    }
                    #printable-medication-logs {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    #print-meds-logs-table {
                        page-break-inside: avoid;
                    }
                }
            `;
            document.head.appendChild(style);
            
            // Trigger print dialog
            window.print();
            
            // Clean up
            setTimeout(() => {
                printableContent.style.display = 'none';
                document.head.removeChild(style);
            }, 100);
        } else {
            console.error('Error fetching logs:', data.error || 'Unknown error');
            alert('Error fetching medication logs: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        alert('Error fetching medication logs: ' + error.message);
    });
});

// Make sure this function is available (same as in your nurse notes code)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}*/

//print nurses notes
/*document.getElementById('print-nurse-notes').addEventListener('click', function() {
    const patientId = document.getElementById('data-patient-id-view').textContent;
    
    // Fetch notes data for this patient
    fetch('/api/receive_data/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            patient_id: patientId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success' && data.notes_data) {
            // Get other patient data from view elements
            const patientName = document.getElementById('data-patient-name-view').textContent;
            const patientBday = document.getElementById('data-patient-bday-view').textContent;
            const physician = document.getElementById('data-physician-name-view').textContent;
            
            // Get current date
            const today = new Date();
            document.getElementById('notes-print-date').textContent = today.toLocaleDateString('en-US', {
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Populate patient info
            document.getElementById('notes-print-id').textContent = patientId;
            document.getElementById('notes-print-name').textContent = patientName;
            document.getElementById('notes-print-bday').textContent = patientBday;
            document.getElementById('notes-print-physician').textContent = physician;
            
            // Populate notes container
            const notesContainer = document.getElementById('print-notes-container');
            notesContainer.innerHTML = ''; // Clear existing content
            
            if (data.notes_data && data.notes_data.length > 0) {
                
                data.notes_data.forEach(note => {

                    const noteElement = document.createElement('div');
                    noteElement.style.marginBottom = '30px';
                    noteElement.style.borderBottom = '1px solid #eee';
                    noteElement.style.paddingBottom = '15px';
                    
                    const dateElement = document.createElement('div');
                    dateElement.style.fontWeight = 'bold';
                    dateElement.style.marginBottom = '8px';
                    dateElement.style.color = '#555';
                    
                    // Format date
                    const noteDate = new Date(note.date);
                    dateElement.textContent = noteDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) + ` • Nurse ID: ${note.nurse_id}`;
                    
                    const contentElement = document.createElement('div');
                    contentElement.style.whiteSpace = 'pre-wrap';
                    contentElement.style.padding = '10px';
                    contentElement.style.backgroundColor = '#f8f9fa';
                    contentElement.style.borderRadius = '4px';
                    contentElement.textContent = note.notes || '';
                    
                    noteElement.appendChild(dateElement);
                    noteElement.appendChild(contentElement);
                    notesContainer.appendChild(noteElement);
                });
            } else {
                notesContainer.innerHTML = '<div style="text-align: center; color: #666; font-style: italic;">No nursing notes recorded</div>';
            }
            
            // Show and print
            const printableContent = document.getElementById('printable-nurse-notes');
            printableContent.style.display = 'block';
            
            // Add print-specific styles
            const style = document.createElement('style');
            style.innerHTML = `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-nurse-notes, #printable-nurse-notes * {
                        visibility: visible;
                    }
                    #printable-nurse-notes {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    #print-notes-container div {
                        page-break-inside: avoid;
                    }
                }
            `;
            document.head.appendChild(style);
            
            window.print();
            
            // Clean up
            setTimeout(() => {
                printableContent.style.display = 'none';
                document.head.removeChild(style);
            }, 100);
        } else {
            console.error('Error loading notes:', data.message || 'No notes data received');
            alert('Failed to load nursing notes for printing');
        }
    })
    .catch(error => {
        console.error('Error fetching notes:', error);
        alert('Error fetching nursing notes');
    });
});

// Helper function to get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}*/

//end of printing

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

            vitalsTab.querySelector('.reason-field').classList.remove('d-none');
            vitalsTab.querySelector('.password-field1').classList.remove('d-none');
            
            // Store original values
            originalValues = {
                name: vitalsTab.querySelector('#data-patient-name-view1').textContent,
                allergies: vitalsTab.querySelector('#data-patient-allergies-view').textContent,
                familyHistory: vitalsTab.querySelector('#data-patient-family-history-view').textContent,
                physicalExam: vitalsTab.querySelector('#data-patient-physical-exam-view').textContent,
                diagnosis: vitalsTab.querySelector('#data-patient-diagnosis-view').textContent,
                //reason: vitalsTab.querySelector('#data-patient-reason-view1').textContent
            };

            // Hide view and show edit elements in vitals tab only
            vitalsTab.querySelectorAll('[id$="-view"]').forEach(el => el.classList.add('d-none'));
            vitalsTab.querySelectorAll('[id$="-edit"]').forEach(el => {
                el.classList.remove('d-none');
                el.classList.remove('is-invalid'); // Clear any previous validation errors
                
                // Set readonly status
                if (el.id.includes('patient-id-edit') || el.id.includes('data-patient-name-edit')) {
                    el.readOnly = true;
                }
            });
            
            // Toggle buttons
            vsEditBtn.classList.add('d-none');
            vsSaveBtn.classList.remove('d-none');
            vsCancelBtn.classList.remove('d-none');
        });

        vsSaveBtn.addEventListener('click', function() {
            const vitalsTab = document.getElementById('vitals');
            const reasonInput = vitalsTab.querySelector('#data-patient-reason-edit');
            const passwordInput = vitalsTab.querySelector('#data-patient-password-edit1');
            let isValid = true;

            // Validate required fields
            if (!reasonInput.value.trim()) {
                reasonInput.classList.add('is-invalid');
                isValid = false;
            } else {
                reasonInput.classList.remove('is-invalid');
            }

            if (!passwordInput.value.trim()) {
                passwordInput.classList.add('is-invalid');
                isValid = false;
            } else {
                passwordInput.classList.remove('is-invalid');
            }

            if (!isValid) {
                return; // Stop if validation fails
            }

            // vs1 edit save to db
            const patientUpdateData = {
                name: document.getElementById('data-patient-name-edit1').value,
                allergies: document.getElementById('data-patient-allergies-edit').value,
                family_history: document.getElementById('data-patient-family-history-edit').value,
                physical_exam: document.getElementById('data-patient-physical-exam-edit').value,
                reason: document.getElementById('data-patient-reason-edit').value,
                password: document.getElementById('data-patient-password-edit1').value
            };

            fetch('/api/update_vs1/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,   // Make sure you include CSRF token if needed
                },
                body: JSON.stringify(patientUpdateData)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    // Update view with edited values
                    vitalsTab.querySelector('#data-patient-name-view1').textContent = 
                    vitalsTab.querySelector('#data-patient-name-edit1').value;   
                    vitalsTab.querySelector('#data-patient-allergies-view').textContent = 
                        vitalsTab.querySelector('#data-patient-allergies-edit').value;  
                    vitalsTab.querySelector('#data-patient-family-history-view').textContent = 
                        vitalsTab.querySelector('#data-patient-family-history-edit').value;   
                    vitalsTab.querySelector('#data-patient-physical-exam-view').textContent = 
                        vitalsTab.querySelector('#data-patient-physical-exam-edit').value;    
                    vitalsTab.querySelector('#data-patient-diagnosis-view').textContent = 
                        vitalsTab.querySelector('#data-patient-diagnosis-edit').value;
                    //vitalsTab.querySelector('#data-patient-reason-view1').textContent = reasonInput.value;

                    // Clear the reason field for next time
                    vitalsTab.querySelector('.reason-field').classList.add('d-none'); 
                    reasonInput.value = '';
                    vitalsTab.querySelector('.password-field1').classList.add('d-none'); 
                    passwordInput.value = '';
                    
                    exitVsEditMode();
                    alert('Patient updated successfully!');
                    // Optionally reload or refresh data here
                } else {
                    alert('Failed to update patient: ' + (result.error || 'Unknown error.'));
                }
            })
            .catch(error => {
                console.error('Error updating patient:', error);
                alert('An error occurred.');
            });

            
        });

        vsCancelBtn.addEventListener('click', function() {
            const vitalsTab = document.getElementById('vitals');
            
            // Restore original values
            vitalsTab.querySelector('#data-patient-name-edit1').value = originalValues.name;
            vitalsTab.querySelector('#data-patient-allergies-edit').value = originalValues.allergies;
            vitalsTab.querySelector('#data-patient-family-history-edit').value = originalValues.familyHistory;
            vitalsTab.querySelector('#data-patient-physical-exam-edit').value = originalValues.physicalExam;
            vitalsTab.querySelector('#data-patient-diagnosis-edit').value = originalValues.diagnosis;
            vitalsTab.querySelector('.reason-field').classList.add('d-none');
            vitalsTab.querySelector('.password-field1').classList.add('d-none');
            
            // Clear validation state
            vitalsTab.querySelector('#data-patient-reason-edit').classList.remove('is-invalid');
            vitalsTab.querySelector('#data-patient-password-edit1').classList.remove('is-invalid');
            
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

//bp
document.querySelector('.bp-input').addEventListener('input', function(e) {
    // Get cursor position
    const cursorPos = this.selectionStart;
    
    // Format the value: allow digits and exactly one slash
    let newValue = this.value.replace(/[^\d\/]/g, '');
    const slashCount = (newValue.match(/\//g) || []).length;
    
    // If more than one slash, keep only the first one
    if (slashCount > 1) {
        const parts = newValue.split('/');
        newValue = parts[0] + '/' + parts.slice(1).join('');
    }
    
    // Update the value
    this.value = newValue;
    
    // Restore cursor position (adjusting for any removed characters)
    this.setSelectionRange(cursorPos, cursorPos);
});

// add vs2
document.getElementById('add-vitals-btn').addEventListener('click', function() {
    const temperature = document.querySelector('input[placeholder="°C"]').value;
    const bloodPressure = document.querySelector('input[placeholder="mmHg"]').value;
    const pulse = document.querySelector('input[placeholder="bpm"]').value;
    const respiratory = document.querySelector('input[placeholder="bpm"]').value;
    const oxygen = document.querySelector('input[placeholder="%"]').value;

    // Check if all fields are filled
    if (!temperature || !bloodPressure || !pulse || !respiratory || !oxygen) {
        alert("Please fill out all fields.");
        return;
    }
    toggleRemarksField(true);

    initPasswordModal()
    const passwordModal = new bootstrap.Modal(document.getElementById('patientPasswordModal'));
    passwordModal.show();
});

//med logs

let originalMedicationData = []; // From database
let workingMedicationData = []; // Includes unsaved changes
let medicationTable;
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DataTable
    medicationTable = $('#medicationLogsTable').DataTable({
        data: workingMedicationData,
        columns: [
            { title: 'Date/Time', data: 'datetime', type: 'date'},
            { title: 'Administered By', data: 'administered_by' },
            { 
                title: 'Status', 
                data: 'status',
                render: function(data, type, row) {
                    // For existing records, show as text (non-editable)
                    if (row.isExisting) {
                        return ` 
                            <span class="status-display ${data === 'administered' ? 'status-administered' : 
                                   data === 'not_taken' ? 'status-not-taken' : 
                                   'status-refused'}">
                                ${data === 'administered' ? 'Administered' : 
                                data === 'not_taken' ? 'Not Taken' : 
                                'Refused'}
                            </span>
                        `;
                    }
                    // For new entries, show radio buttons (editable)
                    return `
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" id="administered_${row.id}" name="status_${row.id}" value="administered" ${data === 'administered' ? 'checked' : ''}>
                            <label class="form-check-label" for="administered_${row.id}">Administered</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" id="not_taken_${row.id}" name="status_${row.id}" value="not_taken" ${data === 'not_taken' ? 'checked' : ''}>
                            <label class="form-check-label" for="not_taken_${row.id}">Not Taken</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" id="refused_${row.id}" name="status_${row.id}" value="refused" ${data === 'refused' ? 'checked' : ''}>
                            <label class="form-check-label" for="refused_${row.id}">Refused</label>
                        </div>
                    `;
                }
            },
            { title: 'Remarks', data: 'remarks', defaultContent: '' },
        ],
        paging: true,
        pageLength: 5,
        lengthMenu: [5, 10, 25, 50],
        searching: true,
        ordering: true,
        order: [[0, 'desc']], // 👈 Default sort by Date/Time ascending
        info: true,
        responsive: true,
        language: {
            paginate: {
                previous: '‹',
                next: '›'
            }
        }
    });

    // Add medication button handler
    document.getElementById('addMedicationBtn').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to add a medication record?')) {
            addMedicationRow();
        }
    });


    //  Undo medication button handler
    document.getElementById('undoMedicationBtn').addEventListener('click', function () {
        if (newlyAddedMedications.length === 0) {
            alert("No newly added medication to undo.");
            return;
        }
    
        // Remove the most recent entry
        const lastAdded = newlyAddedMedications.shift();
    
        // Remove it from workingMedicationData
        const index = workingMedicationData.findIndex(entry => entry.id === lastAdded.id);
        if (index !== -1) {
            workingMedicationData.splice(index, 1);
        }
    
        // Re-render the DataTable
        medicationTable.clear();
        medicationTable.rows.add(workingMedicationData).draw();
        
        // Optional: go back to first page
        medicationTable.page(0).draw(false);
    
        bindStatusChangeEvents(); // Re-bind any necessary listeners
    });
    

    function addMedicationRow() {
        const now = new Date();
        const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        const formattedDateTime = phTime.toISOString().replace('T', ' ').substring(0, 19);

        // Get remarks from input and default to "N/A" if empty
        const remarksInput = document.getElementById('med-remarks');
        let remarks = remarksInput ? remarksInput.value.trim() : '';
        if (!remarks) remarks = 'N/A';

        const newEntry = {
            id: Date.now(), // Temporary ID
            datetime: formattedDateTime,
            administered_by: '',
            status: 'not_taken',
            remarks: remarks,
            medication: medicationId, // assuming this is available globally
            isExisting: false
        };

        fetch('/api/medication_log/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(newEntry)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Update nurse name
                newEntry.administered_by = data.nurse_name;

                // Add to arrays
                workingMedicationData.unshift(newEntry);
                newlyAddedMedications.unshift(newEntry);

                // Refresh table
                medicationTable.clear();
                medicationTable.rows.add(workingMedicationData).draw();
                medicationTable.page(0).draw(false);

                // Re-bind listeners
                bindStatusChangeEvents();

                // Optionally clear input after submission
                if (remarksInput) remarksInput.value = '';
            }
        })
        .catch(error => {
            console.error('Error saving entry:', error);
        });
    }

    
    

    //auto update when the status is clicked
    function bindStatusChangeEvents() {
        $('#medicationLogsTable tbody').off('change', 'input[type=radio]').on('change', 'input[type=radio]', function () {
            const rowId = $(this).attr('name').split('_')[1];
            const newStatus = $(this).val();
    
            const item = workingMedicationData.find(entry => entry.id == rowId);
            if (item) {
                item.status = newStatus;
            }
    
            const newItem = newlyAddedMedications.find(entry => entry.id == rowId);
            if (newItem) {
                newItem.status = newStatus;
                console.log('Updated status in newlyAddedMedications:', newItem);
            }
        });
    }
    
    

    function refreshTable() {
        medicationTable.clear();
        medicationTable.rows.add(workingMedicationData).draw();
        bindStatusChangeEvents(); // <-- add this here
    }
    


    // Modal close handler
    $('#medicationOrderModal').on('hidden.bs.modal', function() {
        // Reset to original data (discard unsaved changes)
        workingMedicationData = [...originalMedicationData];
        refreshTable();
    });


    // Load initial data  // Call loadInitialData inside DOMContentLoaded

});

// Global loadInitialData function
function loadInitialData() {
    const pathParts = window.location.pathname.split('/');
    const patientId = pathParts[2];  // "11" from /patient/11/
    
    


    // Include both patientId and medicationId in the request
    fetch(`/api/medication_log/${patientId}/${medicationId}/`)
      .then(response => response.json())    
      .then(data => {
          console.log("Data successfully loaded");

          // Clear previous data and populate with new data
          originalMedicationData = data.map(entry => ({
              ...entry,
              // Mark existing entries with isExisting: true
              isExisting: true
          }));

          workingMedicationData = [...originalMedicationData];

          // Clear and re-add rows to DataTable
          medicationTable.clear();
          workingMedicationData.forEach(entry => medicationTable.row.add(entry));
          medicationTable.draw();
      })
      .catch(error => {
          console.error('Error loading initial data:', error);
      });
}

//end medlogs


//med edit
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
// Initialize the med modal
const medicationModal = new bootstrap.Modal(document.getElementById('medicationOrderModal'));


// Function to populate and show modal with existing data
function showEditableMedicationModal(drugData) {
    // Populate editable drug details
    $('#med-drug-name').val(drugData.drug_name || drugData.drugName || '');
    $('#med-dose').val(drugData.dose);
    $('#med-units').val(drugData.units);
    $('#med-frequency').val(drugData.frequency);
    $('#med-route').val(drugData.route);
    $('#med-duration').val(drugData.duration);
    $('#med-status').val(drugData.status || 'active');
    
    // Populate additional fields if they exist in drugData
    $('#med-diagnostic').val(drugData.health_diagnostic || drugData.diagnostic || '');
    $('#med-pt-instructions').val(drugData.patient_instructions || drugData.ptInstructions || '');
    $('#med-md-instructions').val(drugData.pharmacist_instructions || drugData.mdInstructions || '');
    
    // Clear password field
    $('#med-password').val('');
    
    // Check if the drug is inactive
    const isInactive = drugData.status === 'inactive' || drugData.status === 'discontinued' || drugData.status === 'completed';
    
    // Get all input, select, and textarea elements in the modal
    const modalInputs = $('#medicationOrderModal').find('input, select, textarea');
    // Get the password confirmation section
    const passwordSection = $('#medicationOrderModal').find('.mb-3').last(); // Targets the last form-group
    
    if (isInactive) {
        // Disable all inputs
        modalInputs.prop('disabled', true);
        // Hide the confirm button and password section
        $('#med-confirm-btn').hide();
        passwordSection.hide();
        
        // Change modal title to indicate view-only mode
        $('#medicationOrderModalLabel').text('View Medication');

        // Hide the add/undo buttons
        $('#addMedicationBtn').hide();
        $('#addMedicationBtn').prop('disabled', true);
        $('#undoMedicationBtn').hide();
        $('#undoMedicationBtn').prop('disabled', true);

        // Make the medication logs table interactive
        if ($.fn.DataTable.isDataTable('#medicationLogsTable')) {
            $('#medicationLogsTable').DataTable().destroy();
        }
        $('#medicationLogsTable').DataTable({
            paging: true,
            searching: true,
            ordering: true,
            pageLength: 5, 
            lengthMenu: [5, 10, 25, 50]
        });
    } else {
        // Enable all inputs
        modalInputs.prop('disabled', false);
        // Show the confirm button and password section
        $('#med-confirm-btn').show();
        passwordSection.show();
        
        // Change modal title back to edit mode
        $('#medicationOrderModalLabel').text('Edit Medication');

        // Show the add/undo buttons
        $('#addMedicationBtn').show();
        $('#addMedicationBtn').prop('disabled', false);
        $('#undoMedicationBtn').show();
        $('#undoMedicationBtn').prop('disabled', false);
    }
    
    // Show modal
    medicationModal.show();

    $('#medicationOrderModal').on('hidden.bs.modal', function() {
        // Reinitialize DataTable when modal closes
        if ($.fn.DataTable.isDataTable('#medicationLogsTable')) {
            $('#medicationLogsTable').DataTable().destroy();
        }
        $('#medicationLogsTable').DataTable({
            paging: true,
            searching: true,
            ordering: true,
            pageLength: 5, 
            lengthMenu: [5, 10, 25, 50]
        });
    });
}
// Example of how to call it when a table row is clicked
$('#active tbody, #inactive tbody').on('click', 'tr', function() {
    // Get the full drug data from data attributes
    fullDrugData = $(this).data('fullDrugData') || {
        drug_name: $(this).find('td:eq(0)').text(),
        dose: $(this).find('td:eq(1)').text(),
        units: $(this).find('td:eq(2)').text(),
        frequency: $(this).find('td:eq(3)').text(),
        route: $(this).find('td:eq(5)').text(),
        duration: $(this).find('td:eq(6)').text(),
        status: $(this).closest('table').attr('id') === 'active' ? 'active' : 
                $(this).closest('table').attr('id') === 'discontinued' ? 'discontinued' :
                $(this).closest('table').attr('id') === 'completed' ? 'completed' : 'inactive',
        // Get additional data from data attributes
        health_diagnostic: $(this).data('health-diagnostic') || '',
        patient_instructions: $(this).data('patient-instructions') || '',
        pharmacist_instructions: $(this).data('pharmacist-instructions') || '',
        id: $(this).data('drug-id') || null
    };

    // // Stop if there's no ID
    if (!fullDrugData.id) {
        return;
    }

    medicationId = fullDrugData.id;
    loadInitialData();
    showEditableMedicationModal(fullDrugData);
});

// Handle password confirmation
// edit medication
$('#med-confirm-btn').click(function() {
    const password = $('#med-password').val();
    
    // console.log(JSON.stringify(newlyAddedMedications, null, 2));
    if (!password) {

        alert('Please enter your password');
        return;
    }
    const medicationData = {
        drug_name: $('#med-drug-name').val(),
        dose: $('#med-dose').val(),
        units: $('#med-units').val(),
        frequency: $('#med-frequency').val(),
        route: $('#med-route').val(),
        duration: $('#med-duration').val(),
        status: $('#med-status').val(),
        health_diagnostic: $('#med-diagnostic').val(),
        patient_instructions: $('#med-pt-instructions').val(),
        pharmacist_instructions: $('#med-md-instructions').val(),
        password: $('#med-password').val(),
        id: fullDrugData.id,
        newly_added_logs: newlyAddedMedications  // Include the new entries
    };
    // medicationId = medicationData.id;
    // console.log(medicationId);
    
    fetch('/api/update_medication/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,  // if CSRF is required
        },
        body: JSON.stringify(medicationData)
    })
    .then(response => response.json())
    .then(data => {
        if(data.status == 'failed'){
            alert(data.message);
        }else{
            console.log("should hide the modal");
            // Update the specific row in the table without reloading
            $('#active tbody tr, #inactive tbody tr').each(function() {
                const fullData = $(this).data('fullDrugData');
                if (fullData && fullData.id == medicationData.id) {
                    // Update fullDrugData attached to the row
                    $(this).data('fullDrugData', medicationData);

                    // Update visible table cells
                    $(this).find('td:eq(0)').text(medicationData.drug_name);
                    $(this).find('td:eq(1)').text(medicationData.dose);
                    $(this).find('td:eq(2)').text(medicationData.units);
                    $(this).find('td:eq(3)').text(medicationData.frequency);
                    $(this).find('td:eq(4)').text(medicationData.quantity);
                    $(this).find('td:eq(5)').text(medicationData.route);
                    $(this).find('td:eq(6)').text(medicationData.duration);
                    $(this).find('td:eq(7)').text(medicationData.start_date);
                    $(this).find('td:eq(8)').text(medicationData.end_date);
                }
            });
            
            alert("Medication's Saved");
            medicationModal.hide();
            window.location.href = window.location.href; 
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
    // Here you would typically verify the password
    console.log('Password verification would happen here');
});

// add Med
document.getElementById('clear_medication').addEventListener('click', function(event) {
    event.preventDefault(); // prevent form submit if inside a form

    // Clear text inputs
    document.getElementById('drugName_medication').value = '';
    document.getElementById('dose_medication').value = 0;
    document.getElementById('units_medication').selectedIndex = 0;
    document.getElementById('frequency_medication').selectedIndex = 0;
    document.getElementById('route_medication').selectedIndex = 0;
    document.getElementById('duration_medication').value = '';
    document.getElementById('quantity_medication').value = '';
    document.getElementById('startDate_medication').value = '';

    // Clear textareas
    document.getElementById('healthDiagnostics_medication').value = '';
    document.getElementById('patientInstructions_medication').value = '';
    document.getElementById('physicianInstructions_medication').value = '';
});

function toggleRemarksField(show) { //function to show or dide remarks field in a modal
    const remarksContainer = document.getElementById('remarks-container');
    if (show) {
        remarksContainer.style.display = 'block';
    } else {
        remarksContainer.style.display = 'none';
    }
}

document.getElementById('add_medication').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent form submission (if inside a form)

    // Get values
    const drugName = document.getElementById('drugName_medication').value.trim();
    const dose = document.getElementById('dose_medication').value.trim();
    const units = document.getElementById('units_medication').value;
    const frequency = document.getElementById('frequency_medication').value;
    const route = document.getElementById('route_medication').value;
    const duration = document.getElementById('duration_medication').value.trim();
    const quantity = document.getElementById('quantity_medication').value.trim();
    const startDate = document.getElementById('startDate_medication').value;
    const healthDiagnostics = document.getElementById('healthDiagnostics_medication').value.trim();
    const patientInstructions = document.getElementById('patientInstructions_medication').value.trim();
    const physicianInstructions = document.getElementById('physicianInstructions_medication').value.trim();

    // Validation (Remove comment after)
    if (
        drugName === '' ||
        dose === '' ||
        units === 'Select' ||
        frequency === 'Select' ||
        route === 'Select' ||
        duration === '' ||
        quantity === '' ||
        startDate === '' 
        // healthDiagnostics === '' ||
        // patientInstructions === '' ||
        // physicianInstructions === ''
    ) {
        alert('Please fill out all fields before adding medication.');
        return; // Block the button from doing anything
    }

    // If all fields are filled correctly, you can proceed
    toggleRemarksField(false);
    
    saveMedication()
    const passwordModal = new bootstrap.Modal(document.getElementById('patientPasswordModal'));
    passwordModal.show();
    
});

//MEMO/NOTES
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
    
    editCondition = false;
    const now = new Date();
    const timestamp = formatDateTime(now);   
    const noteId = Date.now();
    const currentNurseId = " "; // Replace with actual nurse ID okie
    
    const noteElement = document.createElement('div');
    noteElement.className = 'note';
    noteElement.dataset.id = noteId;
    noteElement.innerHTML = `
        <div class="note-header">
            <!--div class="note-title">Nurse's Note</div-->
            <div class="note-meta">
                <span class="note-time">${timestamp}</span>
                <span class="note-nurse">Nurse ID: ${currentNurseId}</span>
            </div>
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
        editCondition = true;
    });

    saveBtn.addEventListener('click', function() {
        content.contentEditable = false;
        saveBtn.style.display = 'none';
        editBtn.style.display = 'inline-block';
        saveNotes(editCondition, saveBtn);
    });

    deleteBtn.addEventListener('click', function() {
        const noteElement = deleteBtn.closest('.note');
        const note_id = noteElement.dataset.id;

        if (confirm('Are you sure you want to delete this note?')) {
            // Always send the delete request to the server
            fetch('/api/delete_note/', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ id: note_id })
            })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    noteElement.remove(); 
                    loadNotes(); // Reload notes if needed
                } else {
                    console.error('Failed to delete note');
                    alert('Failed to delete note');
                }
            })
            .catch(error => {
                console.error('Error deleting note:', error);
                alert('Failed to delete note');
            });
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

function saveNotes(editCondition, saveBtn) {
    let newNoteId;
    // let newNoteCondition = false;
    console.log("svenote button"+editCondition);
    if(!editCondition){
        
        loadNotes()

    
        const notes = [];
        document.querySelectorAll('.note').forEach(noteElement => {
            notes.push({
                id: noteElement.dataset.id,
                content: noteElement.querySelector('.note-content').innerHTML,
                time: noteElement.querySelector('.note-time').textContent
            });
        });
        // Find the latest note based on the 'time' value
        const latestNote = notes.reduce((latest, current) => {
            return parseInt(current.id) > parseInt(latest.id) ? current : latest;
        });
        
        console.log('Sending notes:', latestNote);// This will print the notes data in a readable format


        // Send the notes to Django API endpoint
        fetch('/api/save_notes/', {   // Update this URL with your actual API endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken, // Ensure you have CSRF token set for security
            },
            body: JSON.stringify(latestNote)
        })
        .then(response => response.json())
        .then(result => {
            // console.log('Notes saved successfully:', result.id);
            newNoteId = result.id
            loadNotes()
            // newNoteCondition = true;
            alert('Notes saved successfully!');
        })
        .catch(error => {
            console.error('Error saving notes:', error);
            alert('Failed to save notes');
        });

        // Optionally save to localStorage
        localStorage.setItem('nurseNotes', JSON.stringify(notes));
    }else{
            const noteElement = saveBtn.closest('.note'); // Find the closest .note element
                const note_id = noteElement.dataset.id;  // Get the note ID from the data-id attribute
            // Editing existing note logic
            const editedNote = {
                id: note_id,  // Find the note with 'editing' class
                content: noteElement.querySelector('.note-content').innerHTML,
                time: noteElement.querySelector('.note-time').textContent
            };

            console.log('Editing note:', editedNote);  // This will print the edited note data in a readable format

            // Send the edited note to Django API endpoint
            fetch('/api/edit_note/', {  // Update this URL to your edit API endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken, // Ensure you have CSRF token set for security
                },
                body: JSON.stringify(editedNote)
            })
            .then(response => response.json())
            .then(result => {
                if (result.status === 'success') {
                    console.log('Note edited successfully:', result);
                    alert('Note edited successfully!');
                    // Optionally update the note on the UI without reloading the page
                    editCondition = false;
                    
                    loadNotes()
                } else {
                    console.error('Error editing note:', result.message);
                    alert('Failed to edit note');
                }
            })
            .catch(error => {
                console.error('Error editing note:', error);
                alert('Failed to edit note');
            });

            editCondition = false;
        
    }
}


function loadNotes() {
    // Get the patient ID from wherever you're storing it (sessionStorage or URL)
    const patientId = sessionStorage.getItem('data-patient-id') || 
                     new URLSearchParams(window.location.search).get('id');

    if (!patientId) {
        console.error('No patient ID found');
        return;
    }

    // Make API request to get notes for this patient
    fetch('/api/receive_data/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({
            patient_id: patientId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success' && data.notes_data) {
            renderNotes(data.notes_data);
        } else {
            console.error('Error loading notes:', data.message || 'No notes data received');
        }
    })
    .catch(error => {
        console.error('Error fetching notes:', error);
    });
}
function renderNotes(notesData) {
    // Clear existing notes
    notesList.innerHTML = '';

    if (!notesData || notesData.length === 0) {
        notesList.innerHTML = '<div class="no-notes">No notes found for this patient</div>';
        return;
    }

    // Sort notes by date (newest first) if not already sorted
    notesData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Create and append note elements
    notesData.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.dataset.id = note.id;
        
        // Format the date for display
        const noteDate = new Date(note.date);
        const formattedDate = formatDateTime(noteDate);

        noteElement.innerHTML = `
            <div class="note-header">
                <!--div class="note-title">Nurse's Note</div-->
                <div class="note-meta">
                    <span class="note-time">${formattedDate}</span>
                    <span class="note-nurse">Nurse ID: ${note.nurse_id || 'Unknown'}</span>
                </div>
            </div>
            <div class="note-content">${note.notes || ''}</div>
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
}



// Poll the server periodically instead of relying on long-running request
function checkShiftStatus() {
    fetch('/check_shift/')
        .then(response => response.json())
        .then(data => {
            if (data.session_expired) {
                alert(data.message);
                window.location.href = data.redirect;
            } 
            else if (data.shift_ended) {
                alert(data.message);
                window.location.href = data.redirect;
            }
            else {
                setTimeout(checkShiftStatus, 60000);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // setTimeout(checkShiftStatus, 60000);
        });
}

// Initial call
checkShiftStatus();

//Save vital sign
function initPasswordModal() {
    // Initial state of password validity

    // Show modal
    document.getElementById('patientPasswordModal').addEventListener('show.bs.modal', () => {
        const modal = document.getElementById('patientPasswordModal');
        modal.removeAttribute('aria-hidden');
        modal.removeAttribute('inert');
        document.getElementById('accessPassword').value = '';
        document.getElementById('remark1').value = '';
        setTimeout(() => document.getElementById('accessPassword').focus(), 10);
    });

    // Blur when modal hides
    document.getElementById('patientPasswordModal').addEventListener('hide.bs.modal', () => {
        document.activeElement.blur();
    });

    // Reset modal attributes when hidden
    document.getElementById('patientPasswordModal').addEventListener('hidden.bs.modal', () => {
        const modal = document.getElementById('patientPasswordModal');
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('inert', '');
    });

    // Confirm access button logic
    document.getElementById('confirmAccess').addEventListener('click', function() {
        const password = document.getElementById('accessPassword').value;
        const remark = document.getElementById('remark1').value;

        if (password) { 
            fetch('/api/check_shift_password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken, // CSRF Token if required
                },
                body: JSON.stringify({ 
                    password: password,
                    remark: remark // Include remark here
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.is_valid) {
                    const temperature = document.querySelector('input[placeholder="°C"]').value;
                    const bloodPressure = document.querySelector('input[placeholder="mmHg"]').value;
                    const pulse = document.querySelector('input[placeholder="bpm"]').value;
                    const respiratory = document.querySelector('input[placeholder="bpm"]').value;
                    const oxygen = document.querySelector('input[placeholder="%"]').value;

                        // console.log("inside "+pulse +" "+ oxygen);
                        fetch('/api/save_vital_signs/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken,  // Add CSRF token if needed
                            },
                            body: JSON.stringify({
                                temperature: temperature,
                                blood_pressure: bloodPressure,
                                pulse: pulse,
                                respiratory_rate: respiratory,
                                oxygen: oxygen,
                                remark: remark,
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            
                            alert('Vital Signs Saved');
                            location.reload();
                            // Get values first
                            // const temperature = temperatureInput.value;
                            // const bloodPressure = bloodPressureInput.value;
                            // const pulse = pulseInput.value;
                            // const respiratory = respiratoryInput.value;
                            // const oxygen = oxygenInput.value;

                            // // Now clear them
                            // temperatureInput.value = '';
                            // bloodPressureInput.value = '';
                            // pulseInput.value = '';
                            // respiratoryInput.value = '';
                            // oxygenInput.value = '';
                            // // Process the new row
                            // const newRow = {
                            //     datetime: new Date().toLocaleString(),  // Current date and time
                            //     temperature: temperature,
                            //     blood_pressure: bloodPressure,
                            //     pulse: pulse,
                            //     respiratory: respiratory,
                            //     oxygen: oxygen,
                            //     id: Date.now() + Math.random()  // Unique ID
                            // };

                            // // Get current table data (existing rows)
                            // let tableData = $('#vitals-table').bootstrapTable('getData');

                            // // Add the new row
                            // tableData.push(newRow);

                            // // Refresh the table
                            // $('#vitals-table').bootstrapTable('load', tableData);
                        })
                        
                        .catch(error => console.error("Error:", error));
                        
                        // Print the values
                        console.log({
                            temperature: temperature,
                            bloodPressure: bloodPressure,
                            pulse: pulse,
                            respiratory: respiratory,
                            oxygen: oxygen
                        });
    
                    const modal = bootstrap.Modal.getInstance(document.getElementById('patientPasswordModal'));
                    modal.hide();
                } else {
                    alert('Incorrect Shift Password');
                }
            })
            .catch(error => {
                console.error("Error:", error);
            });
        } else {
            alert('Please enter a password');
        }
    });

    // Allow pressing 'Enter' to confirm access
    document.getElementById('accessPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('confirmAccess').click();
        }
    });
}

// add med 2
function saveMedication() {
    // Initial state of password validity

    // Show modal
    document.getElementById('patientPasswordModal').addEventListener('show.bs.modal', () => {
        const modal = document.getElementById('patientPasswordModal');
        modal.removeAttribute('aria-hidden');
        modal.removeAttribute('inert');
        document.getElementById('accessPassword').value = '';
        setTimeout(() => document.getElementById('accessPassword').focus(), 10);
    });

    // Blur when modal hides
    document.getElementById('patientPasswordModal').addEventListener('hide.bs.modal', () => {
        document.activeElement.blur();
    });

    // Reset modal attributes when hidden
    document.getElementById('patientPasswordModal').addEventListener('hidden.bs.modal', () => {
        const modal = document.getElementById('patientPasswordModal');
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('inert', '');
    });

    // Confirm access button logic
    document.getElementById('confirmAccess').addEventListener('click', function() {
        const password = document.getElementById('accessPassword').value;

        if (password) { 
            fetch('/api/check_shift_password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken, // CSRF Token if required
                },
                body: JSON.stringify({ password: password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.is_valid) {
                    const data = {
                        drugName: document.getElementById('drugName_medication').value.trim(),
                        dose: document.getElementById('dose_medication').value.trim(),
                        units: document.getElementById('units_medication').value,
                        frequency: document.getElementById('frequency_medication').value,
                        route: document.getElementById('route_medication').value,
                        duration: document.getElementById('duration_medication').value.trim(),
                        quantity: document.getElementById('quantity_medication').value.trim(),
                        startDate: document.getElementById('startDate_medication').value,
                        healthDiagnostics: document.getElementById('healthDiagnostics_medication').value.trim(),
                        patientInstructions: document.getElementById('patientInstructions_medication').value.trim(),
                        physicianInstructions: document.getElementById('physicianInstructions_medication').value.trim()
                    };
                    
                    fetch('/api/save_medication/', {   // <-- This is the URL (we will make this URL in Django too)
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken,// very important for Django security
                        },
                        body: JSON.stringify(data)
                    })
                    .then(response => response.json())
                    .then(result => {
                        console.log(result);
                        alert(result.message); // Example: show server response
                        
                    }) 
                    .catch(error => {
                        console.error('Error:', error);
                    });

                    
                    const modal = bootstrap.Modal.getInstance(document.getElementById('patientPasswordModal'));
                    modal.hide();

                    const newRow = {
                        datetime: new Date().toLocaleString(),  // Current date and time
                        drugName: data.drugName,
                        dose: data.dose,
                        units: data.units,
                        frequency: data.frequency,
                        quantity: data.quantity,
                        route: data.route,
                        duration: data.duration,
                        start_date: data.startDate,
                    };
                    
                    // Get the DataTable instance
                    const activeTable = $('#active').DataTable();
                    
                    // Create the new row data
                    const rowValues = [
                        newRow.drugName,
                        newRow.dose,
                        newRow.units,
                        newRow.frequency,
                        newRow.quantity,
                        newRow.route,
                        newRow.duration,
                        newRow.start_date,
                    ];
                    
                    // Add the new row to the table
                    activeTable.row.add(rowValues).draw();
                    document.getElementById('clear_medication').click();
                } else {
                    alert('Incorrect Shift Password');
                }
            })
            .catch(error => {
                console.error("Error:", error);
            });
        } else {
            alert('Please enter a password');
        }
    });

    // Allow pressing 'Enter' to confirm access
    document.getElementById('accessPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('confirmAccess').click();
        }
    });
}