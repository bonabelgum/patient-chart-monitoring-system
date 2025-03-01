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
    function showLoading() { //show loading screen
        document.getElementById("loadingIndicator").style.display = "flex";
        //console.log("Loading screen shown");
    }
    function hideLoading() { //hides loading screen
        document.getElementById("loadingIndicator").style.display = "none";
    }


    //from frontend to django (ADMIN)
    document.getElementById("verifyAdminForm").addEventListener("submit", function (event) {
        event.preventDefault();
        showLoading();
        let formData = { //collect form data
            name: document.getElementById("name").value,
            birthdate: document.getElementById("birthdate").value,
            sex: document.getElementById("sex").value,
            adminID: document.getElementById("adminID").value,
            phone_number: document.getElementById("phone_number").value,
            email: document.getElementById("email").value,
            role: "admin"
        };
        fetch("/verify-admin/", { //sending data to django
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
            //alert(data.message || data.error);
            if (data.success) {
                hideLoading();
                showVerificationModal(); //if no duplicates
            } else {
                hideLoading();
                showErrorModal(data.errors); //if duplicates found
            }
            //from django to frontend
            fetch("/get_admin_details/")
            .then(response => response.json())
            /*.then(data2 => { //test for getting data from django to here
                console.log("From Django:", data2);
            })*/
            .catch(error => {hideLoading(); console.error("Error fetching admin details:", error);});
        }).catch(error => {hideLoading(); console.error("Error:", error)});
    });


    //from frontend to django (NURSE)
    //...code...
    document.getElementById("verifyNurseForm").addEventListener("submit", function (event) {
        event.preventDefault();
        showLoading();
        let formData = { //collect form data
            name: document.getElementById("name_nurse").value,
            birthdate: document.getElementById("birthdate_nurse").value,
            sex: document.getElementById("sex_nurse").value,
            nurseID: document.getElementById("nurseID").value,
            phone_number: document.getElementById("phone_number_nurse").value,
            email: document.getElementById("email_nurse").value,
            role: "nurse"
        };
        // ✅ Console log before sending to check the collected data
        console.log("Collected Form Data:", formData);

        
        fetch("/verify-nurse/", { //sending data to django
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken(), //CSRF token for security
            },
            body: JSON.stringify(formData),
        })
        .then(response => response.json())
        .then(data => {
            // console.log(data); //log response from Django
            //alert(data.message || data.error);
            if (data.success) {
                hideLoading();
                showVerificationModalNurse(); //if no duplicates
            } else {
                hideLoading();
                showErrorModal(data.errors); //if duplicates found
            }
            //from django to frontend
            
        }).catch(error => {hideLoading(); console.error("Error:", error)});
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
    //popup or modal
    //function to show verification modal
    function showVerificationModal() {
        var verifyAdmin = new bootstrap.Modal(document.getElementById('verifyAdmin'));
        verifyAdmin.show();
    }
    function showVerificationModalNurse() {
        var verifyNurse = new bootstrap.Modal(document.getElementById('verifyNurse'));
        verifyNurse.show();
    }
    //function to show error modal
    function showErrorModal(errors) {
        let errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
        document.getElementById("error-message").innerHTML = errors.join("<br>");
        errorModal.show();
    }
});
//phone number
document.addEventListener("DOMContentLoaded", function () {
    var inputs = document.querySelectorAll("#phone_number"); // Select all phone inputs
    inputs.forEach(function (input) {
        var iti = window.intlTelInput(input, {
            initialCountry: "ph",
            preferredCountries: ["ph", "us", "gb"],
            separateDialCode: true,
            utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
        });
    });
});


//for popup
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("verifyNurseForm").addEventListener("submit", function (event) {
        event.preventDefault();
        var verifyNurse = new bootstrap.Modal(document.getElementById('verifyNurse'));
        verifyNurse.show();
    });
});





