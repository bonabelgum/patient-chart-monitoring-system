document.addEventListener("DOMContentLoaded", function () {

    /*function showLoginUser() { //create-account button
        let loginUser = document.querySelector('.login-user');
        let createAccount = document.querySelector('.create-account');
        let loginTitle = document.querySelector('login-title');
        loginUser.style.display = 'flex';
        createAccount.style.display = 'none';
        loginTitle.style.display="none";
    }*/

    function toggleLoginDetails() {
        let loginUser = document.querySelector('.login-user');
        let loginDetails = document.querySelector('.login-details');
        loginUser.style.display = 'none'; // hides login-user
        loginDetails.style.display = 'flex'; // show login-details
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
    function showLoginUser() {
        let loginUser = document.querySelector('.login-user');
        let loginDetails = document.querySelector('.login-details');
        loginUser.style.display = 'flex'; // show login-user
        loginDetails.style.display = 'none'; // hide login-details
    }

    document.querySelectorAll(".user-circle").forEach(circle => {
        circle.addEventListener("click", toggleLoginDetails);
    });

    //document.querySelector(".create-account").addEventListener("click", showLoginUser);
    document.querySelector(".admin").addEventListener("click", showAdminDetails);
    document.querySelector(".nurse").addEventListener("click", showNurseDetails);
    document.querySelector(".back-arrow").addEventListener("click", showLoginUser);
});