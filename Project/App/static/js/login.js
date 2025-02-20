document.addEventListener("DOMContentLoaded", function () {
    function hideLoginUser() {
        let loginUser = document.querySelector('.login-user');
        loginUser.style.display = 'none';
    }
    
    function showLoginUser() {
        let loginUser = document.querySelector('.login-user');
        loginUser.style.display = 'flex';
    }
    document.querySelectorAll(".user-circle").forEach(circle => {
        circle.addEventListener("click", hideLoginUser);
    });
});