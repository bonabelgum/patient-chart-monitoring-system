document.addEventListener('DOMContentLoaded', function() {
    new DataTable('#patient');

    //click event listener for table rows
    document.querySelectorAll('#patient tbody tr').forEach(function(row) {
        row.addEventListener('click', function() {
             //retrieve the patient data from the row's data attributes
             const patientId = row.getAttribute('data-patient-id');
             const patientName = row.getAttribute('data-patient-name');
             const patientWard = row.getAttribute('data-patient-ward');
             const patientStatus = row.getAttribute('data-patient-status');

             //console.log(patientId, patientName, patientWard, patientStatus);
 
             const queryParams = new URLSearchParams({  
                name: patientName,
                ward: patientWard,
                status: patientStatus
            }).toString();
            window.location.href = `/patient/${patientId}/?${queryParams}`;
            
        });
    });
    //admitting patient
    var admitButton = document.getElementById('admit_patient');
    admitButton.addEventListener('click', function() {
        addpatientModal.show();
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
                /* verbose= */ false
            );
            
            html5QrcodeScanner.render((decodedText, decodedResult) => {
                // Successfully scanned
                alert(`Scanned: ${decodedText}`);
                html5QrcodeScanner.clear();
                qrReader.style.display = 'none';
                scanButton.textContent = 'Scan QR Code';
                
                // You can do something with the scanned data here
                console.log("Scanned:", decodedText);
            });
            
            // Store scanner instance so we can stop it later
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

/*MODAL */
document.addEventListener('DOMContentLoaded', function() {
    const admitPatientBtn = document.getElementById('admit_patient');
    const savePatientBtn = document.getElementById('savePatientBtn');
    const patientForm = document.getElementById('patientAdmissionForm');
    
    // Save patient handler
    savePatientBtn.addEventListener('click', function() {
        if (patientForm.checkValidity()) {
            // Get form values
            const patientData = {
                name: document.getElementById('patientName').value,
                birthday: document.getElementById('patientBirthday').value,
                ward: document.getElementById('patientWard').value
            };
            
            // Here you would typically send data to server
            console.log('Patient data to save:', patientData);
            
            // Show success message (you can replace with actual API call)
            alert('Patient admitted successfully!');
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('patientModal'));
            modal.hide();
            
            // Reset form
            patientForm.reset();
        } else {
            // Trigger HTML5 validation messages
            patientForm.reportValidity();
        }
    });
    
    // Optional: Clear form when modal closes
    document.getElementById('patientModal').addEventListener('hidden.bs.modal', function() {
        patientForm.reset();
    });
});