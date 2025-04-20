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
            // console.log("hello success");
            let selectedDay = newShift.querySelector(".shift-day")?.value;
            let start_time = newShift.querySelector(".shift-from")?.value;
            let end_time = newShift.querySelector(".shift-to")?.value;
            
            // console.log(start_time)
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
                    start_time: start_time,  // Must be string in HH:MM format
                    end_time: end_time      // Must be string in HH:MM format
                })
            })
            .then(handleResponse)
            .then(data => {
                console.log("Created shift:", data.shift.id);
                newShift.querySelector(".deleteShiftBtn").addEventListener("click", function () {

                    if (confirm('Are you sure you want to delete this shift?')) {
                        // shiftRow.remove();
                        // console.log("hello id shioft");
                        if (data.shift.id) {
                            deleteShiftFromBackend(data.shift.id);
                            newShift.remove(); //TO BE FIXED <add edit button instead>
                        }
                    }
                });
                // Update your UI here
            })
            .catch(handleError);
            
            function handleResponse(response) {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.message); });
                }
                return response.json();
            }
            
            function handleError(error) {
                console.error('Error:', error);
                alert('Error: ' + error.message);
            }

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

//Remove User/ Employee or Nurse
document.getElementById('removeUserBtn').addEventListener('click', async function() {
    const masterKey = document.getElementById('removeUserKeyInput').value;
    // const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value; // UNCOMMENT THIS
    
    if (!masterKey) {
        alert("Please enter a master key");
        return;
    }
    
    try {
        const response = await fetch('/remove_user/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken // MUST be included
            },
            body: JSON.stringify({
                master_key: masterKey // Key matches what Django expects
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Invalid request');
        }
        
        console.log("Success:", data);
        // Check the actual status from your Django response
        if (data.status === 'success') {
            alert(`✅ Success: ${data.message}`);
            // Optional: Refresh page or update UI
            location.reload();
        } else {
            alert(`❌ Failed: ${data.message}`);
        }
        // Optional: Refresh page or update UI
        location.reload();
        
    } catch (error) {
        console.error("Error:", error);
        alert(`Error: ${error.message}`);
    }
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
            // console.log("hello id shioft");
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

async function deleteShiftFromBackend(shiftId) {
    try {
        const response = await fetch('/delete_shift/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                'shift_id': shiftId
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete shift');
        }

        console.log('Success:', data);
        alert(`Shift deleted successfully!`);
        // Refresh or update your UI here
        location.reload(); // Or update the table dynamically
        
    } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    }
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

const scheduleTab = document.getElementById('tab3-tab');

scheduleTab.addEventListener('shown.bs.tab', function (event) {
    console.log('Schedule tab is now active!');
    renderScheduleTable(); // Call your rendering function here
});
// document.addEventListener('DOMContentLoaded', function() {
//     renderScheduleTable();
// });



function renderScheduleTable() {

    
    //DATA TEST ONLY
    // const scheduleData = [
    //     { day: 1, employeeId: 'Aundray', startTime: '2:00', endTime: '16:00' },
    //     { day: 1, employeeId: 'Aundray', startTime: '22:00', endTime: '24:00' },
    //     { day: 1, employeeId: 'ID:6', startTime: '5:10', endTime: '18:00' },
    //     { day: 1, employeeId: 'ID:8', startTime: '1:00', endTime: '18:00' },
    //     { day: 5, employeeId: 'ID:7', startTime: '5:30', endTime: '18:00' }
    // ];

    getAllShiftThenReturnArray().then(scheduleData => {
        console.log(scheduleData); // ✅ Confirm the data arrives as expected

        const days = [
            { id: 1, name: 'Monday' },
            { id: 2, name: 'Tuesday' },
            { id: 3, name: 'Wednesday' },
            { id: 4, name: 'Thursday' },
            { id: 5, name: 'Friday' },
            { id: 6, name: 'Saturday' },
            { id: 7, name: 'Sunday' }
        ];

        const timeSlots = Array.from({ length: 24 }, (_, i) => ({
            hour: i + 1,
            label: `${i + 1}:00`
        }));

        const timeHeader = document.querySelector('.time-slots-container');
        timeHeader.innerHTML = '';
        timeSlots.forEach(slot => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = slot.label;
            timeHeader.appendChild(timeSlot);
        });

        const minuteWidth = 100 / 1440;
        const scheduleRows = document.querySelector('.schedule-rows');
        scheduleRows.innerHTML = '';

        days.forEach(day => {
            const dayRow = document.createElement('div');
            dayRow.className = 'schedule-row';

            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';
            dayCell.textContent = day.name;
            dayRow.appendChild(dayCell);

            const timeCells = document.createElement('div');
            timeCells.className = 'time-cells';

            const daySchedules = scheduleData.filter(item => item.day === day.id);
            const scheduleLanes = calculateScheduleLanes(daySchedules);

            daySchedules.forEach((schedule, index) => {
                const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
                const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
                const visibleStartMinutes = 60;
                const startMinutes = (startHour * 60) + startMinute;
                const endMinutes = (endHour * 60) + endMinute;
                const duration = Math.max(0, endMinutes - startMinutes);
                const lane = scheduleLanes[index];

                const employeeBlock = document.createElement('div');
                employeeBlock.className = 'employee-block';
                employeeBlock.textContent = schedule.employeeId;
                employeeBlock.style.left = `${((startMinutes - visibleStartMinutes) / (1440 - visibleStartMinutes)) * 100}%`;
                employeeBlock.style.width = `${(duration / (1440 - visibleStartMinutes)) * 100}%`;
                employeeBlock.style.top = `${10 + (lane * 35)}px`;
                employeeBlock.title = `${schedule.employeeId}: ${schedule.startTime} - ${schedule.endTime}`;

                const colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'];
                employeeBlock.style.backgroundColor = colors[index % colors.length];

                timeCells.appendChild(employeeBlock);
            });

            const lanesNeeded = daySchedules.length > 0 ? Math.max(...scheduleLanes) + 1 : 0;
            timeCells.style.minHeight = `${50 + (lanesNeeded * 35)}px`;

            dayRow.appendChild(timeCells);
            scheduleRows.appendChild(dayRow);
        });
    });
}


// Calculate optimal lanes for schedules to prevent overlapping
function calculateScheduleLanes(schedules) {
    if (schedules.length === 0) return [];
    
    // Sort schedules by start time
    const sorted = [...schedules].sort((a, b) => {
        const aStart = timeToMinutes(a.startTime);
        const bStart = timeToMinutes(b.startTime);
        return aStart - bStart;
    });

    const lanes = [];
    const laneEndTimes = [];

    sorted.forEach(schedule => {
        const start = timeToMinutes(schedule.startTime);
        const end = timeToMinutes(schedule.endTime);
        
        let lane = 0;
        while (lane < laneEndTimes.length && laneEndTimes[lane] > start) {
            lane++;
        }
        
        if (lane < laneEndTimes.length) {
            laneEndTimes[lane] = end;
        } else {
            laneEndTimes.push(end);
        }
        
        // Map back to original schedule order
        const originalIndex = schedules.findIndex(s => 
            s.employeeId === schedule.employeeId && 
            s.startTime === schedule.startTime && 
            s.endTime === schedule.endTime);
        lanes[originalIndex] = lane;
    });

    return lanes;
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function getAllShiftThenReturnArray() {
    const dayMapping = {
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6,
        "Sunday": 7
    };

    return fetch('/get_all_shifts/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const formattedData = data.shifts.map(shift => ({
                day: dayMapping[shift.day],
                employeeId: shift.employee.name,  // or use shift.employee.name if you prefer
                startTime: shift.start_time,
                endTime: shift.end_time
            }));
            return formattedData;
        })
        .catch(error => {
            console.error('Error fetching shifts:', error);
            return [];  // Return an empty array on error
        });
}


/*document.addEventListener('DOMContentLoaded', function() {
    fetch('/get_all_shifts/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Console.log all employee names
            data.shifts.forEach(shift => {
                console.log(shift.employee.name);
                addRowToTable({name: shift.employee.name, role: "Nurse"});
            });
            
            // Optional: Also display in the browser
            const namesList = data.shifts.map(shift => shift.employee.name).join('\n');
            // alert('Employee names:\n' + namesList);
        })
        .catch(error => {
            console.error('Error fetching shifts:', error);
        });
});



function addRowToTable(employee) {
    const tbody = document.querySelector('.schedule-table tbody');
    const row = document.createElement('tr');
    
    // Employee info cell
    const nameCell = document.createElement('td');
    nameCell.innerHTML = `
        <div class="employee-info">
            <strong>${employee.name}</strong>
            <div class="text-muted small">${employee.role}</div>
        </div>
    `;
    nameCell.classList.add('employee-cell');
    row.appendChild(nameCell);
    
    // Day cells
    for (let i = 0; i < 7; i++) {
        const dayCell = document.createElement('td');
        dayCell.classList.add('schedule-cell');
        dayCell.setAttribute('contenteditable', 'true');
        row.appendChild(dayCell);
    }
    
    tbody.appendChild(row);
}*/

// Example usage:
// addRowToTable({name: "John Doe", role: "Nurse"});
// addRowToTable({name: "Jane Smith", role: "Doctor"});