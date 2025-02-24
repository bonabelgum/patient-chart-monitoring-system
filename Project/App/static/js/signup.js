document.addEventListener("DOMContentLoaded", function () {
    function toggleSignUpDetails() {
        let signupUser = document.querySelector('.signup-user');
        let signupDetails = document.querySelector('.signup-details');
        signupUser.style.display = 'none'; // hides signup-user
        signupDetails.style.display = 'flex'; // show signup-details
    }
    function showAdminDetails() { //when admin user-circle is clicked
        let adminDetails = document.querySelector('.admin-details');
        let nurseDetails = document.querySelector('.nurse-details');
        adminDetails.style.display = 'block';
        nurseDetails.style.display = 'none';
    }
    function showNurseDetails() { //when nurse user-circle is clicked
        let adminDetails = document.querySelector('.admin-details');
        let nurseDetails = document.querySelector('.nurse-details');
        adminDetails.style.display = 'none';
        nurseDetails.style.display = 'block';
    }
    function showSignUpUser() {
        let signupUser = document.querySelector('.signup-user');
        let signupDetails = document.querySelector('.signup-details');
        signupUser.style.display = 'flex'; // show signup-user
        signupDetails.style.display = 'none'; // hide signup-details
    }
    document.querySelectorAll(".user-circle").forEach(circle => {
        circle.addEventListener("click", toggleSignUpDetails);
    });
    document.querySelector(".admin").addEventListener("click", showAdminDetails);
    document.querySelector(".nurse").addEventListener("click", showNurseDetails);
    document.querySelector(".back-arrow").addEventListener("click", showSignUpUser);
});

//sending data 
document.addEventListener("DOMContentLoaded", function () {
    //from frontend to django
    document.getElementById("verifyAdminForm").addEventListener("submit", function (event) {
        event.preventDefault();
        let formData = { //collect form data
            name: document.getElementById("name").value,
            birthdate: document.getElementById("birthdate").value,
            adminID: document.getElementById("adminID").value,
            email: document.getElementById("email").value
        };
        fetch("/verify-admin/", { //sending data to django (using fetch API?)
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken(), //CSRF token for security
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            console.log(data); //log response from Django
            alert(data.message || data.error);

            //from django to frontend
            fetch("/get_admin_details/")
            .then(response => response.json())
            .then(data2 => {
                console.log("From Django:", data2);
            })
            .catch(error => console.error("Error fetching admin details:", error));

        }).catch(error => console.error("Error:", error));
    });
    function getCSRFToken() {//function to get CSRF token from cookies
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            let cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                let cookie = cookies[i].trim();
                if (cookie.startsWith("csrftoken=")) {
                    cookieValue = cookie.substring("csrftoken=".length, cookie.length);
                    break;
                }
            }
        }
        return cookieValue;
    }
});

//for popup
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("verifyNurseForm").addEventListener("submit", function (event) {
        event.preventDefault();
        var verifyNurse = new bootstrap.Modal(document.getElementById('verifyNurse'));
        verifyNurse.show();
    });
    document.getElementById("verifyAdminForm").addEventListener("submit", function (event) {
        event.preventDefault();
        var verifyAdmin = new bootstrap.Modal(document.getElementById('verifyAdmin'));
        verifyAdmin.show();
    });
});