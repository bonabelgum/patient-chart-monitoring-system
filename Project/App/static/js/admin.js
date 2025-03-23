function fetchEmployees() {
    //initialize DataTable with empty data
    let employeesTable = new DataTable('#employees', {
        destroy: true,
        responsive: true,
        autoWidth: false,
        createdRow: function(row, data, dataIndex) {
            //Status column
            if (data[3].trim() === "Pending") {
                row.classList.add("table-danger");
            }
        }
    });
    fetch('/employees/')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched Data:", data); // debugging
            employeesTable.clear(); // Clear existing table data

            // Add new data
            data.forEach(employee => {
                let status = employee.status || "Registered"; 
                let button = `<button class="btn btn-primary btn-sm view-more" 
                    data-id="${employee.employee_id}" 
                    data-name="${employee.name}" 
                    data-role="${employee.role}" 
                    data-email="${employee.email}"
                    data-phone="${employee.phone_number}"
                    data-status="${status}" 
                    data-shift="Monday-Friday"
                    >View More</button>`;

                employeesTable.row.add([
                    employee.employee_id,
                    employee.name,
                    employee.role,
                    status,
                    button
                ]);
            });

            // Redraw table
            employeesTable.draw();
        })
        .catch(error => console.error('Error loading employee data:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    new DataTable('#logs'); //initialize DataTable for the second table (#logs)

    // //initialize DataTable with empty data
    // let employeesTable = new DataTable('#employees', {
    //     destroy: true,
    //     responsive: true,
    //     autoWidth: false,
    //     createdRow: function(row, data, dataIndex) {
    //         //Status column
    //         if (data[3].trim() === "Pending") {
    //             row.classList.add("table-danger");
    //         }
    //     }
    // });

    //fetch and populate the employee data
    fetchEmployees();
    


    document.addEventListener("click", function(event) { //user's more details
        if (event.target.classList.contains("view-more")) {
            let button = event.target;
    
            let id = button.getAttribute("data-id");

            // Send the ID to the Django backend using fetch
            fetch(`/get_nurse_data/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken // Include CSRF token for security
                },
                body: JSON.stringify({ id: id })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                // Handle the response from the server if needed
            })
            .catch((error) => {
                console.error('Error:', error);
            });
            let name = button.getAttribute("data-name");
            let phone = button.getAttribute("data-phone");
            let email = button.getAttribute("data-email");
            let position = button.getAttribute("data-role");
            let status = button.getAttribute("data-status");
            let shift = button.getAttribute("data-shift");
    
            //populate modal fields
            document.getElementById("modal-id").textContent = id;
            document.getElementById("modal-name").textContent = name;
            document.getElementById("modal-number").textContent = phone;
            document.getElementById("modal-email").textContent = email;
            document.getElementById("modal-position").textContent = position;
            document.getElementById("modal-status").textContent = status;
            document.getElementById("modal-shift").textContent = shift;

            //for confirmation is status is pending
            let verificationSection = document.getElementById("verification-section");
            //adding shift
            let shiftContainer = document.getElementById("shift-container");
            let addShiftBtn = document.getElementById("addShiftBtn");
            let shiftRow = document.getElementById("shift-row");
            //dangerzone
            let dangerZone = document.getElementById("dangerZone");
            let dangerZoneContent = document.getElementById("dangerZoneContent");

            shiftContainer.innerHTML = "";

            //show verification section
            if (status === "Pending") {
                verificationSection.style.display = "block";
                dangerZone.style.display = "none";
                dangerZoneContent.style.display = "none";
            } else {
                verificationSection.style.display = "none";
                dangerZone.style.display = "block";
            }

            //show shift selection
            if (position === "admin") {
                shiftContainer.style.display = "none";
                addShiftBtn.style.display = "none";
                shiftRow.style.display = "none";
            } else {
                shiftRow.style.display = "block";
                //show shift section only if status is "Registered" & if nurse
                if (status === "Registered") {
                    shiftContainer.style.display = "block";
                    addShiftBtn.style.display = "block";
                }
                else {
                    shiftContainer.style.display = "none";
                    addShiftBtn.style.display = "none";
                }
            }
            //show modal
            let modal = new bootstrap.Modal(document.getElementById("employeeModal"));
            modal.show();

            
        }
    });
//ADDING SCHED
    document.getElementById("addShiftBtn").addEventListener("click", function () {
        let shiftContainer = document.getElementById("shift-container");

        //create a new schedule row
        let newShift = document.createElement("div");
        newShift.classList.add("shift-row");

        newShift.innerHTML = `
            <select class="form-select form-select-sm shift-day">
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
            </select>
            <span>From:</span>
            <input type="time" class="form-control form-control-sm shift-from">
            <span>To:</span>
            <input type="time" class="form-control form-control-sm shift-to">
            <button class="btn btn-primary btn-sm saveShiftBtn">Save</button>
            <button class="btn btn-danger btn-sm cancelShiftBtn">Cancel</button>
        `;
        //appending the new shift row above the button
        shiftContainer.appendChild(newShift);

        //handle saving the schedule NOT YET DONE
        newShift.querySelector(".saveShiftBtn").addEventListener("click", function () {
            let selectedDay = newShift.querySelector(".shift-day")?.value;
            let fromTime = newShift.querySelector(".shift-from")?.value;
            let toTime = newShift.querySelector(".shift-to")?.value;

            //validate input fields
            if (!selectedDay || !fromTime || !toTime) {
                alert("Please fill in all fields.");
                return;
            }
            //replace input fields with static text //NOT SAVED TO THE DB YET
            newShift.innerHTML = `
                ${selectedDay}: ${fromTime} - ${toTime}
                <button class="btn btn-danger btn-sm ms-2 deleteShiftBtn">Delete</button>
            `;
            newShift.querySelector(".deleteShiftBtn").addEventListener("click", function () {
                newShift.remove(); //TO BE FIXED <add edit button instead>
            });

            alert("Shift saved!");
            });

        //cancel the shift input
        newShift.querySelector(".cancelShiftBtn").addEventListener("click", function () {
            newShift.remove();
            });
        });
//for master key confirmation
document.getElementById("rejectBtn").addEventListener("click", function() {
    document.getElementById("rejectKeyInput").style.display = "block";
    document.getElementById("confirmRejectKeyBtn").style.display = "block";
    document.getElementById("cancelRejectKeyBtn").style.display = "block";

    document.getElementById("masterKeyInput").style.display = "none";
    document.getElementById("masterKeyInput").value = ""; //Clear the inside
    document.getElementById("confirmMasterKeyBtn").style.display = "none";
    document.getElementById("cancelMasterKeyBtn").style.display = "none";
});
document.getElementById("approveBtn").addEventListener("click", function() {
    document.getElementById("masterKeyInput").style.display = "block";
    document.getElementById("confirmMasterKeyBtn").style.display = "block";
    document.getElementById("cancelMasterKeyBtn").style.display = "block";

    document.getElementById("rejectKeyInput").style.display = "none";
    document.getElementById("rejectKeyInput").value = ""; //Clear the inside
    document.getElementById("confirmRejectKeyBtn").style.display = "none";
    document.getElementById("cancelRejectKeyBtn").style.display = "none";
});


});

document.addEventListener("DOMContentLoaded", function () {
    const employeeModal = document.getElementById("employeeModal");
    const masterKeyInput = document.getElementById("masterKeyInput");
    const confirmMasterKeyBtn = document.getElementById("confirmMasterKeyBtn");
    const cancelMasterKeyBtn = document.getElementById("cancelMasterKeyBtn");
    const rejectKeyInput = document.getElementById("rejectKeyInput");
    const confirmRejectKeyBtn = document.getElementById("confirmRejectKeyBtn");
    const cancelRejectKeyBtn = document.getElementById("cancelRejectKeyBtn");
    const dangerZoneContent = document.getElementById("dangerZoneContent");
    //event listener for when the modal is shown
    employeeModal.addEventListener("shown.bs.modal", function () {
        //console.log("Modal is open");
    });
    //event listener for when the modal is hidden
    employeeModal.addEventListener("hidden.bs.modal", function () {
        //console.log("Modal is closed");
        //clear master key input/ btn when modal is closed
        hideMasterKeyElements();
        dangerZoneContent.style.display = "none";
    });

    // Get the User input then send to django
    confirmMasterKeyBtn.addEventListener("click", function () {
        // Send the input to Django using fetch
        
        let masterKey = masterKeyInput.value;
        fetch("/verify_master_key/", {  // Replace with your Django endpoint
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken  // Include CSRF token for security
            },
            body: JSON.stringify({ master_key: masterKey }),  // Send the master key
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                
                alert("Master key is valid!");
                var myModal = bootstrap.Modal.getInstance(document.getElementById('employeeModal'));
                myModal.hide(); // Hide modal
                fetchEmployees(); // Repopulate the employees 
                // Handle success (e.g., redirect or update UI)
            } else {
                alert("Invalid master key.");
                // Handle failure
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
        });
    });

    // Get the User input then send to django
    confirmRejectKeyBtn.addEventListener("click", function () {
        // Send the input to Django using fetch
        
        let masterKey = rejectKeyInput.value;
        console.log(masterKey);
        fetch("/reject_master_key/", {  // Replace with your Django endpoint
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken  // Include CSRF token for security
            },
            body: JSON.stringify({ master_key: masterKey }),  // Send the master key
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                
                alert("Master key is valid!");
                var myModal = bootstrap.Modal.getInstance(document.getElementById('employeeModal'));
                myModal.hide(); // Hide modal
                fetchEmployees(); // Repopulate the employees 
                // Handle success (e.g., redirect or update UI)
            } else {
                alert("Invalid master key.");
                // Handle failure
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
        });
    });

    //hide elements when the cancel button is clicked
    cancelMasterKeyBtn.addEventListener("click", function () {
        hideMasterKeyElements();
    });
    cancelRejectKeyBtn.addEventListener("click", function () {
        hideMasterKeyElements();
    });
    //function to hide master key elements
    function hideMasterKeyElements() {
        masterKeyInput.style.display = "none";
        confirmMasterKeyBtn.style.display = "none";
        cancelMasterKeyBtn.style.display = "none";
        rejectKeyInput.style.display = "none";
        confirmRejectKeyBtn.style.display = "none";
        cancelRejectKeyBtn.style.display = "none";
    }
});

//toggle danger zone
document.addEventListener("DOMContentLoaded", function () {
    // Toggle danger zone content visibility on button click
    document.addEventListener("click", function (event) {
        if (event.target && event.target.id === "toggleDangerZone") {
            dangerZoneContent.style.display = 
                (dangerZoneContent.style.display === "none" || dangerZoneContent.style.display === "") 
                ? "block" 
                : "none";
        }
    });
});


