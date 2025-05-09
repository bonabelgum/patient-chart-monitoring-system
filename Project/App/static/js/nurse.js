let currentPatientData = null;
let end_time_schedule = null;
let globalPatientData = null;

window.addEventListener('pageshow', function (event) {
    if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
        location.reload();
    }
});


document.addEventListener('DOMContentLoaded', () => {
    // Disable back navigation by manipulating the history state
    window.history.pushState(null, null, window.location.href); // Push the current state into history

    // Prevent going back
    window.onpopstate = function () {
        window.history.pushState(null, null, window.location.href); // Keep pushing the same state to block back action
    };

    // Your shift password modal code here, if necessary...
});



document.getElementById('nurse-logs-tab').addEventListener('click', function() {
    // console.log('Logs tab clicked');
    fetchAndPopulateNurseLogs();

    // You can perform any other actions here
});


// Function to fetch and populate nurse logs
function fetchAndPopulateNurseLogs() {
    const table = $('#nurse-logs-table').DataTable({
        "destroy": true,
        "paging": true,
        "ordering": true,
        "info": true,
        "order": [[0, "desc"]], // Sort by first column (date) descending
        "columnDefs": [
            {
                "targets": 0,
                "width": "300px",
                "className": "dt-left",
                "type": "date" // Ensure proper date sorting
            }
        ]
    });
  
    table.clear();

    fetch('/api/get_nurse_logs/')
      .then(response => response.json())
      .then(data => {
        data.logs.forEach(log => {
          table.row.add([ 
            log.date_time,
            log.activity
          ]);
        });
        table.draw(); // Draw once after all rows are added
      })
      .catch(error => {
        console.error('Error fetching logs:', error);
      });
}
  
  // Call this function to fetch and repopulate the logs when needed
  fetchAndPopulateNurseLogs();
  

// Initialize modal event listeners once
function initPasswordModal() {
    document.getElementById('patientPasswordModal').addEventListener('show.bs.modal', () => {
        const modal = document.getElementById('patientPasswordModal');
        modal.removeAttribute('aria-hidden');
        modal.removeAttribute('inert');
        document.getElementById('accessPassword').value = '';
        setTimeout(() => document.getElementById('accessPassword').focus(), 10);
    });
    
    document.getElementById('patientPasswordModal').addEventListener('hide.bs.modal', () => {
        document.activeElement.blur();
    });
    
    document.getElementById('patientPasswordModal').addEventListener('hidden.bs.modal', () => {
        const modal = document.getElementById('patientPasswordModal');
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('inert', '');
    });
    
    document.getElementById('confirmAccess').addEventListener('click', function() {
        const password = document.getElementById('accessPassword').value;
        
        if (password) { //get shift password
            const queryParams = new URLSearchParams({
                id: currentPatientData.id,
                name: currentPatientData.name || '',
                ward: currentPatientData.ward || '',
                status: currentPatientData.status || ''
            }).toString();

            const modal = bootstrap.Modal.getInstance(document.getElementById('patientPasswordModal'));
            modal.hide();
            
            window.location.href = `/patient/${currentPatientData.id}/?${queryParams}`; //redirect
        } else {
            alert('Please enter a password');
        }
    });
    
    document.getElementById('accessPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('confirmAccess').click();
        }
    });
}
initPasswordModal()


///---
document.addEventListener('DOMContentLoaded', function() {
    const table = $('#patient').DataTable({
        // "paging": false,      // Disable pagination
        // "pageLength": 10,      // Display 5 rows per page
        // "scrollY": "300px",   // Set the height of the table, allowing it to scroll
        // "scrollCollapse": true, // Allows table to collapse if fewer rows are available
        // "searching": true 
    });  // Initialize DataTable

    $('#patient tbody').on('click', 'tr', function() {
        const rowData = table.row(this).data(); // Get row data
        
        if (!rowData) {
            console.error("Row data not found!");
            return;
        }
    
        const patientId = rowData[0]; // ID is the first column
        const patientName = rowData[1] || '';
        const patientNumber = rowData[2] || '';
        const patientWard = rowData[3] || '';
        const patientStatus = rowData[4] || '';
        
        const queryParams = new URLSearchParams({
            id: patientId,
            name: patientName,
            number: patientNumber,
            ward: patientWard,
            status: patientStatus,
            end_time: rowData[5] || '' // Add if available
        }).toString();
        
        window.location.href = `/patient/${patientId}/?${queryParams}`;
    });

    fetch('/get_patients/')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            data.patients.forEach(patient => {
                addPatientRow(table, patient);
                end_time_schedule = patient.end_time
            });
            
        })
        .catch(error => {
            console.error("Error fetching patients:", error);
        });

    //admitting patient
    // Initialize modal with proper focus control
    const patientModal = new bootstrap.Modal('#patientModal', {
        focus: true  // Ensures proper focus management
    });

    // When opening modal
    document.getElementById('patientModal').addEventListener('show.bs.modal', () => {
        const modal = document.getElementById('patientModal');
        modal.removeAttribute('aria-hidden');
        modal.removeAttribute('inert');
    });

    // When closing modal
    document.getElementById('patientModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('admit_patient').focus();
    });

    // Fix for close button focus
    document.querySelector('#patientModal .btn-close').addEventListener('click', (e) => {
        e.preventDefault();
        patientModal.hide();
        document.getElementById('admit_patient').focus();
    });

    //qr code scanning
    document.getElementById('scan_qr').addEventListener('click', function() {
        const qrReader = document.getElementById('qr-reader');
        const scanButton = this;
        
        if (qrReader.style.display === 'none') {
            // Start scanning
            qrReader.style.display = 'block';
            scanButton.textContent = 'Stop Scanning';
            
            const html5QrcodeScanner = new Html5QrcodeScanner(
                "qr-reader", 
                { 
                    fps: 10, 
                    qrbox: 250 
                },
                false
            );
            
            html5QrcodeScanner.render((decodedText, decodedResult) => {
                html5QrcodeScanner.clear();
                qrReader.style.display = 'none';
                scanButton.textContent = 'Scan QR Code';
                
                checkPatient(decodedText).then(PatientExist => {
                    if (PatientExist) {
                        console.log("Scanned:", decodedText);
                        const queryParams = new URLSearchParams({
                            id: decodedText,
                        }).toString();
                
                        window.location.href = `/patient/${decodedText}/?${queryParams}`;
                    }else {
                        //alert(`Patient ID ${decodedText} does not exist!`);
                        alert(`Patient does not exist!`);
                    }
                });
            });
            
            scanButton.scanner = html5QrcodeScanner;
        } else {
            // Stop scanning
            qrReader.style.display = 'none';
            scanButton.textContent = 'Scan QR Code';
            if (scanButton.scanner) {
                scanButton.scanner.clear();
            }
        }
    });
});



// Function to add a patient row to the DataTable
function addPatientRow(table, patient) {
    const newRow = table.row.add([
        patient.id,
        patient.name,
        patient.number || 'Unassigned',
        patient.ward || 'Unassigned',
        patient.status,
    ]).draw().node();

    // Set data attributes using jQuery (recommended for DataTables)
    $(newRow).data({
        'patient-id': patient.id,
        'patient-name': patient.name,
        'patient-number': patient.number,
        'patient-ward': patient.ward,
        'patient-status': patient.status
    });
}

// Function to check if patient exist in db
function checkPatient(hospitalId) {
    return fetch('/api/check_patient_id/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ hospital_id: hospitalId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.exists) {
            console.log("Patient exists.");
            return true;
        } else {
            console.log("Patient does not exist.");
            return false;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        return false;
    });
}




document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    const savePatientBtn = document.getElementById('savePatientBtn');
    const patientForm = document.getElementById('patientAdmissionForm');
    const patientModal = document.getElementById('patientModal');
    const qrModal = document.getElementById('qrCodeModal');
    
    // Initialize modal instances
    const patientModalInstance = new bootstrap.Modal(patientModal);
    const qrModalInstance = new bootstrap.Modal(qrModal);
    
    // Save patient handler
    savePatientBtn.addEventListener('click', function() {
        globalPatientData = {
            name: document.getElementById('patientName').value,
            birthday: document.getElementById('patientBirthday').value,
            number: document.getElementById('patientNumber').value,
            ward: document.getElementById('patientWard').value
        };
        //console.log("Stored patient data:", globalPatientData);
        
        if (patientForm.checkValidity()) {
            const patientData = {
                name: document.getElementById('patientName').value,
                sex: document.getElementById('patientSex').value,
                birthday: document.getElementById('patientBirthday').value,
                weight: parseFloat(document.getElementById('patientWeight').value),
                height: parseFloat(document.getElementById('patientHeight').value),
                phone_number: document.getElementById('phone_number_patient').value,
                status: document.getElementById('patientStatus').value,
                number: document.getElementById('patientNumber').value,
                ward: document.getElementById('patientWard').value,
                physician_name: document.getElementById('physicianName').value
            };
            
            fetch('/admit-patient/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(patientData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert(data.message);
                    
                    // First, move focus to body to prevent focus trap
                    document.body.focus();
                    
                    // Then hide the patient modal
                    patientModalInstance.hide();
                    
                    // When patient modal is fully hidden, show QR modal
                    patientModal.addEventListener('hidden.bs.modal', function showQRModal() {
                        patientModal.removeEventListener('hidden.bs.modal', showQRModal);
                        
                        // Prepare QR code
                        const qrContainer = document.getElementById('qrCodeImageContainer');
                        qrContainer.innerHTML = `<img src="${data.qr_code_url}" alt="Patient QR Code" class="img-fluid">`;
                        
                        // Show QR modal
                        qrModalInstance.show();
                        
                        // Reset form
                        patientForm.reset();
                    }, { once: true });
                    
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while admitting the patient.');
            });
        } else {
            patientForm.reportValidity();
        }
    });
    
    // Patient Modal events
    patientModal.addEventListener('show.bs.modal', function() {
        this.removeAttribute('aria-hidden');
        setTimeout(() => savePatientBtn.focus(), 100);
    });
    
    patientModal.addEventListener('hide.bs.modal', function() {
        // Ensure no focus is trapped during hide transition
        document.activeElement.blur();
    });
    
    patientModal.addEventListener('hidden.bs.modal', function() {
        this.setAttribute('aria-hidden', 'true');
    });
    
    // QR Modal events
    qrModal.addEventListener('show.bs.modal', function() {
        this.removeAttribute('aria-hidden');
        setTimeout(() => {
            const printBtn = document.getElementById('printQrBtn');
            if (printBtn) printBtn.focus();
        }, 100);
    });
    
    qrModal.addEventListener('hide.bs.modal', function() {
        // Ensure no focus is trapped during hide transition
        document.activeElement.blur();
    });
    
    qrModal.addEventListener('hidden.bs.modal', function() {
        this.setAttribute('aria-hidden', 'true');
        //page refresh
        window.location.reload();
    });
    
    // Clear form when patient modal closes
    patientModal.addEventListener('hidden.bs.modal', function() {
        patientForm.reset();
    });

    // Function to get CSRF token
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
});

//print
let nextPatientId = null; // Store this globally
// When generating a new patient ID (before saving to database)
function generatePatientId() {
    // Get the last ID from the table
    const lastRow = document.querySelector('#patient tbody tr:last-child');
    const lastId = lastRow?.dataset?.patientId;
    
    // Calculate next ID
    if (lastId) {
        const lastNum = parseInt(lastId.replace(/[^0-9]/g, '')) || 0;
        nextPatientId = `${lastNum + 1}`;
    } else {
        nextPatientId = '1'; // Starting ID if no patients exist
    }
    
    return nextPatientId;
}
// Get the print button from the QR modal
document.getElementById('printQrBtn').addEventListener('click', function() {
    console.log("Print stored data:", globalPatientData);
    generatePatientId();
    
    // Get patient data from the form or stored variable
    const patientData = currentPatientData || {
        id: nextPatientId,
        name: globalPatientData.name,
        birthday: globalPatientData.birthday,
        ward: globalPatientData.ward
    };

    // Get QR code image source
    const qrCodeImg = document.querySelector('#qrCodeImageContainer img');
    const qrCodeSrc = qrCodeImg ? qrCodeImg.src : '';

    // Debug: Check what values we're getting
    console.log('Patient Data for Wristband:', {
        id: nextPatientId,
        name: globalPatientData.name,
        birthday: globalPatientData.birthday,
        ward: globalPatientData.ward,
        qrCode: qrCodeSrc
    });

    // Populate the printable wristband
    document.getElementById('print-id').textContent = nextPatientId;
    document.getElementById('print-name').textContent = patientData.name;
    document.getElementById('print-bday').textContent = patientData.birthday;
    document.getElementById('print-ward').textContent = patientData.ward;
    document.getElementById('print-qr').src = qrCodeSrc;

    // Show and print the wristband
    const printableContent = document.getElementById('printable-wristband');
    printableContent.style.display = 'block';
    window.print();
    printableContent.style.display = 'none';
});


//phone number
document.addEventListener("DOMContentLoaded", function () {
    var inputs = document.querySelectorAll("#phone_number, #phone_number_patient"); //select all phone inputs
    inputs.forEach(function (input) {
        var iti = window.intlTelInput(input, {
            initialCountry: "ph",
            preferredCountries: ["ph", "us", "gb"],
            separateDialCode: true,
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
        });
    });
});

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