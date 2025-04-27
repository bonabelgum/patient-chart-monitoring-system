let schedule_end_time = null
let isPasswordValid = false;

document.addEventListener('DOMContentLoaded', function () {
    //retrieve the patient data from sessionStorage
    const patientId = sessionStorage.getItem('data-patient-id');
    const patientName = sessionStorage.getItem('data-patient-name');
    const patientWard = sessionStorage.getItem('data-patient-ward');
    const patientStatus = sessionStorage.getItem('data-patient-status');
    const physicianName= sessionStorage.getItem('data-physician-name-view');

    const urlParams = new URLSearchParams(window.location.search);
    const patientIdParams = urlParams.get('id');
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
    
            document.getElementById('data-patient-phone-view').textContent = patient.phone_number;
            document.getElementById('data-patient-phone-edit').value = patient.phone_number;
    
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
                console.log('Raw VS Data:', data.vitals_data);
                // 1. Transform data
                const tableData = data.vitals_data.map(vs => ({
                    datetime: vs.datetime || vs.date_and_time || '',
                    temperature: vs.temperature || vs.temp || '',
                    blood_pressure: vs.blood_pressure || vs.bp || '',
                    pulse: vs.pulse || vs.pulse_rate || '',
                    respiratory: vs.respiratory || vs.respiratory_rate || '',
                    oxygen: vs.oxygen || vs.oxygen_saturation || '',
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
                            { field: 'oxygen', title: 'Oxygen saturation', sortable: true }
                        ]
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
                        drug.route || ''
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
                        patientTab.querySelector('#data-patient-phone-view').textContent = editedPhone;
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
    console.log('Patient Data:', {
        id: patientId,
        name: patientName,
        birthday: patientBirthday,
        ward: patientWard,
        qrCode: qrCodeSrc
    });
    
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
            `;
        });
    } else {
        medsTable.innerHTML = '<tr><td colspan="6" style="padding: 8px; text-align: center; border: 1px solid #ddd;">No medications prescribed</td></tr>';
    }
    
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
            `;
        });
    } else {
        vitalsTable.innerHTML = '<tr><td colspan="6" style="padding: 8px; text-align: center; border: 1px solid #ddd;">No vital signs recorded</td></tr>';
    }
    
    // Show and print
    const printableContent = document.getElementById('printable-patient-chart');
    printableContent.style.display = 'block';
    window.print();
    printableContent.style.display = 'none';
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
                diagnosis: document.getElementById('data-patient-diagnosis-edit').value,
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
    
    initPasswordModal()
    const passwordModal = new bootstrap.Modal(document.getElementById('patientPasswordModal'));
    passwordModal.show();
});


//med
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
    
    // Populate additional fields if they exist in drugData
    $('#med-diagnostic').val(drugData.health_diagnostic || drugData.diagnostic || '');
    $('#med-pt-instructions').val(drugData.patient_instructions || drugData.ptInstructions || '');
    $('#med-md-instructions').val(drugData.pharmacist_instructions || drugData.mdInstructions || '');
    
    // Clear password field
    $('#med-password').val('');
    
    // Show modal
    medicationModal.show();
}
let selectedDrugData = {};
// Example of how to call it when a table row is clicked
$('#active tbody, #inactive tbody').on('click', 'tr', function() {
    // Get the full drug data from data attributes
    fullDrugData = $(this).data('fullDrugData') || {
        drug_name: $(this).find('td:eq(0)').text(),
        dose: $(this).find('td:eq(1)').text(),
        units: $(this).find('td:eq(2)').text(),
        frequency: $(this).find('td:eq(3)').text(),
        route: $(this).find('td:eq(5)').text(),
        // Get additional data from data attributes
        health_diagnostic: $(this).data('health-diagnostic') || '',
        patient_instructions: $(this).data('patient-instructions') || '',
        pharmacist_instructions: $(this).data('pharmacist-instructions') || '',
        id: $(this).data('drug-id') || null
    };
    
    showEditableMedicationModal(fullDrugData);
});
// Handle password confirmation
// edit medication
$('#med-confirm-btn').click(function() {
    const password = $('#med-password').val();
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
        health_diagnostic: $('#med-diagnostic').val(),
        patient_instructions: $('#med-pt-instructions').val(),
        pharmacist_instructions: $('#med-md-instructions').val(),
        password: $('#med-password').val(),
        id: fullDrugData.id 
    };
    
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
                    $(this).find('td:eq(5)').text(medicationData.route);
                }
            });
            
            alert("Medication's Saved");
            medicationModal.hide();
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
    // Here you would typically verify the password
    console.log('Password verification would happen here');

    /*
        // Validate form
    if (!$('#medicationOrderForm')[0].checkValidity()) {
        $('#medicationOrderForm').addClass('was-validated');
        return;
    }
    // Collect all form data
    const formData = {
        drugName: $('#med-drug-name').val(),
        dose: $('#med-dose').val(),
        units: $('#med-units').val(),
        frequency: $('#med-frequency').val(),
        route: $('#med-route').val(),
        diagnostic: $('#med-diagnostic').val(),
        ptInstructions: $('#med-pt-instructions').val(),
        mdInstructions: $('#med-md-instructions').val(),
        password: $('#med-password').val()
    };
    // Here you would typically make an AJAX call to save the data
    console.log('Saving medication order:', formData);
    
    // Close modal after save
    medicationModal.hide();
    */
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
    const now = new Date();
    const timestamp = formatDateTime(now);   
    const noteId = Date.now();
    const currentNurseId = "N123"; // Replace with actual nurse ID okie
    
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
            //title: noteElement.querySelector('.note-title').textContent,
            content: noteElement.querySelector('.note-content').innerHTML,
            time: noteElement.querySelector('.note-time').textContent
        });
    });
    localStorage.setItem('nurseNotes', JSON.stringify(notes));
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
function initPasswordModal() {
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
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            // Process the new row
                            const newRow = {
                                datetime: new Date().toLocaleString(),  // Current date and time
                                temperature: temperature,
                                blood_pressure: bloodPressure,
                                pulse: pulse,
                                respiratory: respiratory,
                                oxygen: oxygen,
                                id: Date.now() + Math.random()  // Unique ID
                            };

                            // Get current table data (existing rows)
                            let tableData = $('#vitals-table').bootstrapTable('getData');

                            // Add the new row
                            tableData.push(newRow);

                            // Refresh the table
                            $('#vitals-table').bootstrapTable('load', tableData);
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