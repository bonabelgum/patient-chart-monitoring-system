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
        addEmployeeModal.show();
    });
});
