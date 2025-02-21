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
});