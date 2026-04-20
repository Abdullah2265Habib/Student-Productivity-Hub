document.querySelector('.container').addEventListener('submit', function(e) {
    e.preventDefault();

    let form = new FormData();

    form.append("email", document.getElementById("login-email").value);
    form.append("password", document.getElementById("login-pass").value);

    fetch("http://localhost/Student-Productivity-Hub/backend/login.php", {
        method: "POST",
        body: form
    })
    .then(res => res.text())
    .then(msg => {
        if (msg.trim() === "success") {
            window.location = "../dashboard.html";
        } else {
            alert("Invalid login");
        }
    })
    .catch(err => console.error(err));
});