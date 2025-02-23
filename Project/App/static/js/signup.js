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

document.addEventListener("DOMContentLoaded", function () { //for popup
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

    //testing
    document.getElementById("verifyAdminForm").addEventListener("submit", function (event) {
        event.preventDefault();
        //collect form data
        let formData = {
            name: document.getElementById("name").value,
            birthdate: document.getElementById("birthdate").value,
            adminID: document.getElementById("adminID").value,
            email: document.getElementById("email").value
        };
        //sending data to django (using fetch API?)
        fetch("/verify-admin/", {
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
        })
        .catch(error => console.error("Error:", error));
    });
    //function to get CSRF token from cookies
    function getCSRFToken() {
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