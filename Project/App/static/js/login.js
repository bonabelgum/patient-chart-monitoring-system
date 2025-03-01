
// console.log("login.js loaded!")
// document.addEventListener("DOMContentLoaded", function () {
//     document.getElementById("get-otp-btn").addEventListener("click", function () {
//         console.log("button click")
        
//     });
// });

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("get-otp-btn").addEventListener("click", function () {
        let employeeID = document.getElementById("employeeID").value;
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
    let employeeID = document.getElementById("employeeID").value;
    let password = document.getElementById("password").value;
    console.log("button click")

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
        document.getElementById("responseMessage").innerText = data.message;
    });
});