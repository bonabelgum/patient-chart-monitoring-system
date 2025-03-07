document.addEventListener('DOMContentLoaded', function() {
    new DataTable('#logs'); //initialize DataTable for the second table (#logs)

    //new DataTable('#employees'); //initialize DataTable for the first table (#employees)
    //fetch employee data from the server
    /*fetchEmployees();

    function fetchEmployees() {
        fetch('/employees/') 
            .then(response => response.json())
            .then(data => {
                let tableBody = document.querySelector('#employees tbody');
                tableBody.innerHTML = ''; //clear existing table rows

                data.forEach(employee => {
                    let row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${employee.employee_id}</td>
                        <td>${employee.name}</td>
                        <td>${employee.role}</td>
                        <td>Status</td> <!--temporary for now -->
                        <td>Active</td> <!--temporary for now -->
                    `;
                    tableBody.appendChild(row);
                });

                //reinitialize DataTable after updating content
                employeesTable.destroy(); 
                employeesTable = new DataTable('#employees');

                attachRowClickEvents();
            })
            .catch(error => console.error('Error loading employee data:', error));
    }

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
    });*/


    //initialize DataTable with empty data
    let employeesTable = new DataTable('#employees', {
        destroy: true,
        responsive: true,
        autoWidth: false,
        /*rowCallback: function(row) {
            $(row).css('cursor', 'pointer'); //cursor style
        }*/
    });

    //fetch and populate the employee data
    fetchEmployees();
    function fetchEmployees() {
        fetch('/employees/')
            .then(response => response.json())
            .then(data => {
                employeesTable.clear(); //clear existing table data

                //add new data
                data.forEach(employee => {
                    employeesTable.row.add([
                        employee.employee_id,
                        employee.name,
                        employee.role,
                        "Status",  //temporary placeholder
                        "Active"   //temporary placeholder
                    ]);
                });

                //redraw table
                employeesTable.draw();

                attachRowClickEvents();
            })
            .catch(error => console.error('Error loading employee data:', error));
    }

    function attachRowClickEvents() {
        document.querySelectorAll('#employee-body tr').forEach(function(row) {
            row.addEventListener('click', function() {
                let id = row.querySelector('td:nth-child(1)').textContent;
                let name = row.querySelector('td:nth-child(2)').textContent;
                let position = row.querySelector('td:nth-child(3)').textContent;
                let status = row.querySelector('td:nth-child(4)').textContent;
                let active = row.querySelector('td:nth-child(5)').textContent;

                document.getElementById('modal-id').textContent = id;
                document.getElementById('modal-name').textContent = name;
                document.getElementById('modal-position').textContent = position;
                document.getElementById('modal-status').textContent = status;
                document.getElementById('modal-active').textContent = active;

                new bootstrap.Modal(document.getElementById('employeeModal')).show();
            });
        });
    }

    
    //adding employee
    var addButton = document.getElementById('add_employee');
    //modal for adding employee
    var addEmployeeModal = new bootstrap.Modal(document.getElementById('addEmployeeModal'));
    //click event listener to the "Add Employee" button
    addButton.addEventListener('click', function() {
        addEmployeeModal.show();
    });
});
