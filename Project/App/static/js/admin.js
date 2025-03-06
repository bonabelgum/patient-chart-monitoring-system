document.addEventListener('DOMContentLoaded', function() {
    new DataTable('#employees'); //initialize DataTable for the first table (#employees)
    new DataTable('#logs'); //initialize DataTable for the second table (#logs)

    //click event listener for table rows
    document.querySelectorAll('#employees tbody tr').forEach(function(row) {
        row.addEventListener('click', function() {
            var id = row.querySelector('td:nth-child(1)').textContent;
            var name = row.querySelector('td:nth-child(2)').textContent;
            var position = row.querySelector('td:nth-child(3)').textContent;
            var status = row.querySelector('td:nth-child(4)').textContent;
            var active = row.querySelector('td:nth-child(5)').textContent;
            //insert the data into the modal
            document.getElementById('modal-id').textContent = id;
            document.getElementById('modal-name').textContent = name;
            document.getElementById('modal-position').textContent = position;
            document.getElementById('modal-status').textContent = status;
            document.getElementById('modal-active').textContent = active;
            //show the modal
            new bootstrap.Modal(document.getElementById('employeeModal')).show();
        });
    });
    //adding employee
    var addButton = document.getElementById('add_employee');
    //modal for adding employee
    var addEmployeeModal = new bootstrap.Modal(document.getElementById('addEmployeeModal'));
    //click event listener to the "Add Employee" button
    addButton.addEventListener('click', function() {
        addEmployeeModal.show();
    });
});
