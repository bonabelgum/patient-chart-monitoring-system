


// console.log("button click")
// document.addEventListener("DOMContentLoaded", function () {
//     document.getElementById("get-otp-btn").addEventListener("click", function () {
//         let employeeID = document.getElementById("employeeID").value;
//         console.log("button click")
//         fetch("{% url 'get_otp' %}", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value
//             },
//             body: JSON.stringify({ employeeID: employeeID, action: "get_otp" })
//         })
//         .then(response => response.json())
//         .then(data => {
//             document.getElementById("responseMessage").innerText = data.message;
//         });
//     });
// });