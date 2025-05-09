function showLoading() { //show loading screen
    document.getElementById("loadingIndicator").style.display = "flex";
    //console.log("Loading screen shown");
}
function hideLoading() { //hides loading screen
    document.getElementById("loadingIndicator").style.display = "none";
}
document.addEventListener("DOMContentLoaded", function () {
    
    document.getElementById("get-otp-btn").addEventListener("click", function () {
        let employeeID = document.getElementById("employeeID").value;

        responseMessage.innerText = "Sending OTP...";
        responseMessage.style.color = "#6c757d";

        fetch("/handle-request/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value
            },
            body: JSON.stringify({ employeeID: employeeID, action: "get_otp" })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById("responseMessage").innerText = data.message;
        });
    });
});


document.getElementById("login-btn").addEventListener("click", function () {
    showLoading();
    let employeeID = document.getElementById("employeeID").value;
    let password = document.getElementById("password").value;

    fetch("/handle-request/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value
        },
        body: JSON.stringify({ employeeID: employeeID, password: password, action: "login" })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Full response data:", data);
        if (data.redirect_url) {
            hideLoading();
            console.log("🔁 Redirecting to:", data.redirect_url);
            window.location.replace(data.redirect_url);  // ✅ Safer redirect (no back entry)
        } else {
            hideLoading();
            document.getElementById("responseMessage").innerText = data.message || data.error;
        }
    });
    
});