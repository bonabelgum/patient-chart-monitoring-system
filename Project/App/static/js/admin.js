document.addEventListener('DOMContentLoaded', function() {
    new DataTable('#logs'); //initialize DataTable for the second table (#logs)

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

    //fetch and populate the employee data
    fetchEmployees();
    function fetchEmployees() {
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
                        data-status="${status}" 
                        data-schedule="Monday-Friday">View More</button>`;

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


    document.addEventListener("click", function(event) {
        if (event.target.classList.contains("view-more")) {
            let button = event.target;
    
            let id = button.getAttribute("data-id");
            let name = button.getAttribute("data-name");
            let position = button.getAttribute("data-role");
            let status = button.getAttribute("data-status");
            let schedule = button.getAttribute("data-schedule");
    
            //populate modal fields
            document.getElementById("modal-id").textContent = id;
            document.getElementById("modal-name").textContent = name;
            document.getElementById("modal-position").textContent = position;
            document.getElementById("modal-status").textContent = status;
            document.getElementById("modal-schedule").textContent = schedule;

            document.getElementById("schedule-container").innerHTML = "";
    
            //show modal
            let modal = new bootstrap.Modal(document.getElementById("employeeModal"));
            modal.show();
        }
    });
//ADDING SCHED
    document.getElementById("addScheduleBtn").addEventListener("click", function () {
        let scheduleContainer = document.getElementById("schedule-container");

        //create a new schedule row
        let newSchedule = document.createElement("div");
        newSchedule.classList.add("schedule-row");

        newSchedule.innerHTML = `
            <select class="form-select form-select-sm schedule-day">
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
            </select>
            <span>From:</span>
            <input type="time" class="form-control form-control-sm schedule-from">
            <span>To:</span>
            <input type="time" class="form-control form-control-sm schedule-to">
            <button class="btn btn-primary btn-sm saveScheduleBtn">Save</button>
            <button class="btn btn-danger btn-sm cancelScheduleBtn">Cancel</button>
        `;
        //appending the new schedule row above the button
        scheduleContainer.appendChild(newSchedule);

        //handle saving the schedule NOT YET DONE
        newSchedule.querySelector(".saveScheduleBtn").addEventListener("click", function () {
            let selectedDay = newSchedule.querySelector(".schedule-day")?.value;
            let fromTime = newSchedule.querySelector(".schedule-from")?.value;
            let toTime = newSchedule.querySelector(".schedule-to")?.value;

            //validate input fields
            if (!selectedDay || !fromTime || !toTime) {
                alert("Please fill in all fields.");
                return;
            }
            //replace input fields with static text //NOT SAVED TO THE DB YET
            newSchedule.innerHTML = `
                ${selectedDay}: ${fromTime} - ${toTime}
                <button class="btn btn-danger btn-sm ms-2 deleteScheduleBtn">Delete</button>
            `;
            newSchedule.querySelector(".deleteScheduleBtn").addEventListener("click", function () {
                newSchedule.remove(); //TO BE FIXED <add edit button instead>
            });

            alert("Schedule saved!");
            });

        //cancel the schedule input
        newSchedule.querySelector(".cancelScheduleBtn").addEventListener("click", function () {
            newSchedule.remove();
            });
        });

});
