let currentPatientData = null;
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
    const table = $('#patient').DataTable();  // Initialize DataTable

    fetch('/get_patients/')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            data.patients.forEach(patient => {
                addPatientRow(table, patient);
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
                        // Store the patient data (you might want to get more details here)
                        currentPatientData = {
                            id: decodedText,
                            name: '', // You might want to fetch these details
                            ward: '',
                            status: ''
                        };
                        
                        // Show the same password modal
                        const passwordModal = new bootstrap.Modal(document.getElementById('patientPasswordModal'));
                        passwordModal.show();
                    } else {
                        //alert(`Patient ID ${decodedText} does not exist!`);
                        alert(`Patient ID does not exist!`);
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
        patient.ward || 'Unassigned',
        patient.status,
    ]).draw().node();

    newRow.dataset.patientId = patient.id;
    newRow.dataset.patientName = patient.full_name;
    newRow.dataset.patientWard = patient.ward;
    newRow.dataset.patientStatus = patient.status;

    newRow.addEventListener("click", function() {
        currentPatientData = {
            id: this.dataset.patientId,
            name: this.dataset.patientName,
            ward: this.dataset.patientWard,
            status: this.dataset.patientStatus
        };
    
        const passwordModal = new bootstrap.Modal(document.getElementById('patientPasswordModal'));
        passwordModal.show();
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
        if (patientForm.checkValidity()) {
            const patientData = {
                name: document.getElementById('patientName').value,
                sex: document.getElementById('patientSex').value,
                birthday: document.getElementById('patientBirthday').value,
                phone_number: document.getElementById('phone_number_patient').value,
                status: document.getElementById('patientStatus').value,
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