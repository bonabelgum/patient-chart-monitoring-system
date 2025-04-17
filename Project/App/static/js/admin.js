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
    // new DataTable('#logs'); //initialize DataTable for the second table (#logs)
    const table = $('#logs').DataTable();  // Assuming you're using DataTable

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
    // addLogEntry("2025-04-12 14:45", "Shift created for Nurse Aundray");
    // Function to fetch and display all logs

    fetch('/get_all_logs/')  // Call the URL endpoint to get logs
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const logs = data.data;
                // Clear existing rows in the table
                table.clear();

                // Add each log entry to the table
                logs.forEach(log => {
                    addLogEntry(table,log.date_time, log.activity)
                    // table.row.add([
                    //     `<td>${log.date_time}</td>`,
                    //     log.activity
                    // ]).draw(false);
                });
            } else {
                console.error('Failed to load logs:', data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching logs:', error);
        });

    
    // addLogEntry("Sample4", 'Sample4');
    let id;


    document.addEventListener("click", function(event) { //user's more details
        if (event.target.classList.contains("view-more")) {
            let button = event.target;
    
            id = button.getAttribute("data-id");

            

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

            // Send the ID to the Django backend using fetch
            fetch(`/get_nurse_data/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken // Include CSRF token for security
                },
                body: JSON.stringify({ id: id })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    // console.log("hello data");
                    // console.log('Nurse ID:', data.nurse_id);
                    // console.log('Shifts:', data.shifts);
                    // let shiftRowContainer = document.getElementBy
                    
                    // // Process each shift from the response
                    // 3. Access shifts array
                    // const shifts = data.shifts;
                    
                    // // 4. Loop through shifts
                    // shifts.forEach(shift => {
                    //     console.log("Shift ID:", shift.id);
                    //     console.log("Day:", shift.day);          // e.g. "Monday"
                    //     console.log("Day Number:", shift.day_number);  // e.g. 1
                    //     console.log("Start Time:", shift.start_time);  // e.g. "09:00"
                    //     console.log("End Time:", shift.end_time);    // e.g. "17:00"
                    // });
                    data.shifts.forEach(shift => {
                        // console.log("hello data");
                        const shiftRow = createOrUpdateShiftRow(
                            // null, // Create new row
                            shift.day, 
                            shift.start_time, 
                            shift.end_time,
                            shift.id
                        );
                        document.getElementById('shift-container').appendChild(shiftRow);
                    });
                } else { 
                    console.error('Error:', data.message);
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to fetch nurse data');
            });


            //show modal
            let modal = new bootstrap.Modal(document.getElementById("employeeModal"));
            modal.show();

            
        }
    });
    //ADDING SCHED
    document.getElementById("addShiftBtn").addEventListener("click", function () {
        let shiftContainer = document.getElementById("shift-container");
        console.log("hello id "+id);
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
            <button class="btn btn-primary btn-sm saveShiftBtn" id="saveShiftBtn">Save</button>
            <button class="btn btn-danger btn-sm cancelShiftBtn id="cancelShiftBtn"">Cancel</button>
        `;
        //appending the new shift row above the button
        shiftContainer.appendChild(newShift);

        //handle saving the schedule NOT YET DONE
        newShift.querySelector(".saveShiftBtn").addEventListener("click", function () {
            console.log("hello success");
            let selectedDay = newShift.querySelector(".shift-day")?.value;
            let start_time = newShift.querySelector(".shift-from")?.value;
            let end_time = newShift.querySelector(".shift-to")?.value;

            const formData = {
                selectedDay:selectedDay, 
                start_time:start_time,
                end_time:end_time
                // Add CSRF token for Django
                // csrfmiddlewaretoken: document.querySelector('[name=csrfmiddlewaretoken]').value
            };

            //validate input fields
            if (!selectedDay || !start_time || !end_time) {
                alert("Please fill in all fields.");
                return;
            }
            
            //replace input fields with static text //NOT SAVED TO THE DB YET
            newShift.innerHTML = `
                ${selectedDay}: ${start_time} - ${end_time}
                <button class="btn btn-danger btn-sm ms-2 deleteShiftBtn">Delete</button>
            `;
            
            newShift.querySelector(".deleteShiftBtn").addEventListener("click", function () {
                newShift.remove(); //TO BE FIXED <add edit button instead>
            });
            
            alert("Shift saved!");

            // Send POST request
            // Send POST request
            fetch('/create_shift/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    day: selectedDay,
                    start_time: start_time,
                    end_time: end_time
                })
            })
            .then(function(response) {
                if (!response.ok) {
                    return response.json().then(function(err) {
                        throw new Error(err.message || 'Server error');
                    });
                }
                return response.json();
            })

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

function createOrUpdateShiftRow(day, start_time, end_time, shiftId = null) {
    // Create new div element
    const shiftRow = document.createElement('div');
    shiftRow.className = 'shift-row-schedule';
    
    // Add data attribute if shift ID is provided
    if (shiftId) {
        shiftRow.dataset.shiftId = shiftId;
    }
    
    // Create the shift text content
    const shiftText = document.createTextNode(`${day}: ${start_time} - ${end_time} `);
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger btn-sm ms-2 deleteShiftBtn';
    deleteBtn.textContent = 'Delete';
    
    // Add event listener
    deleteBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this shift?')) {
            shiftRow.remove();
            console.log("hello id shioft");
            if (shiftId) {
                deleteShiftFromBackend(shiftId);
            }
        }
    });
    
    // Append elements
    shiftRow.appendChild(shiftText);    
    shiftRow.appendChild(deleteBtn);
    
    return shiftRow;
}

function deleteShiftFromBackend(shiftId) {
    // Get CSRF token
    // const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch('/delete_shift/', {  // Your Django URL endpoint
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
            // 'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            'shift_id': shiftId  // Sending the shift ID in request body
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Server response:', data);
        if (data.success) {
            console.log(`Shift ID ${shiftId} was successfully received by Django`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
// logActivity("I added activity hehe") = call this to add log activity
function logActivity(message) {
    fetch('/log_activity/', {  // Your Django URL endpoint
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
            // 'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            'message': message  // Sending the shift ID in request body
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Server response:', data);
        if (data.success) {
            console.log(`Activity: ${message} was successfully received by Django`);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// const table = $('#logs').DataTable();

// Call this to add log
function addLogEntry(table, dateTime, activity) {
    table.row.add([
        dateTime,
        activity
    ]).draw(false); // draw(false) keeps current pagination
}


//TIME TABLE/ SCHED
document.addEventListener('DOMContentLoaded', function () {
    const tab3Button = document.querySelector('#tab3-tab');

    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            if (event.target === tab3Button) {
                loadScheduleData();
            }
        });
    });

    function loadScheduleData() {
        fetch('/api/schedule/')
            .then(response => response.json())
            .then(data => {
                populateScheduleTable(data.shifts);
            })
            .catch(error => {
                console.error('Error loading schedule:', error);
            });
    }

    function populateScheduleTable(shifts) {
        const tbody = document.querySelector('#tab3 .schedule-table tbody');
        tbody.innerHTML = '';
        const uniqueTimes = new Set();
        
        // Collect all unique times from shifts (only for sorting)
        shifts.forEach(shift => {
            uniqueTimes.add(shift.start_time);
            uniqueTimes.add(shift.end_time);
        });
        
        // Convert to sorted array
        const timeSlots = Array.from(uniqueTimes).sort((a, b) => a.localeCompare(b));
        
        // Create table rows for each time slot
        for (let i = 0; i < timeSlots.length - 1; i++) {
            const start = timeSlots[i];
            const end = timeSlots[i + 1];
            const row = document.createElement('tr');
            
            // Time label
            const timeCell = document.createElement('td');
            timeCell.textContent = `${start} - ${end}`;
            row.appendChild(timeCell);
            
            // Create cells for each day
            for (let day = 1; day <= 7; day++) {
                const cell = document.createElement('td');
                
                // STRICT day matching - only show if shift is exactly for this day
                const dayShifts = shifts.filter(s => s.day === day);
                
                // Check if any shift for this day overlaps with current time slot
                const hasShift = dayShifts.some(shift => {
                    // Convert all times to minutes for accurate comparison
                    const slotStart = timeToMinutes(start);
                    const slotEnd = timeToMinutes(end);
                    const shiftStart = timeToMinutes(shift.start_time);
                    const shiftEnd = timeToMinutes(shift.end_time);
                    
                    // Check for overlap
                    return (shiftStart < slotEnd && shiftEnd > slotStart);
                });
                
                if (hasShift) {
                    const div = document.createElement('div');
                    div.classList.add('bg-warning', 'p-1', 'rounded', 'mb-1', 'text-center');
                    div.innerHTML = `<strong>Employee 2</strong><br>`;
                    cell.appendChild(div);
                }
                row.appendChild(cell);
            }
            tbody.appendChild(row);
        }
    }
    
    // Helper function to convert "HH:MM" to minutes
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
});




