document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("logoutButton").addEventListener("click", function () {
        const csrftoken = getCookie("csrftoken");

        fetch("/logout/", {
            method: "POST",
            headers: {
                "X-CSRFToken": csrftoken,  // Add CSRF token in the header
                "Content-Type": "application/json"
            },
            credentials: "same-origin"
        })
        .then(response => {
            if (response.ok) {
                window.location.href = "/";  //index.html
            } else {
                alert("Logout failed!");
            }
        })
        .catch(error => console.error("Error:", error));
    });

    // Function to get CSRF token from cookies
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
