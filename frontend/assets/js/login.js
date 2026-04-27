// Toggle password visibility
document.getElementById('login-eye').addEventListener('click', function () {
    const passInput = document.getElementById('login-pass');
    const icon = this.querySelector('i');

    if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        passInput.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
});

// Login form submit
document.getElementById('login-form').addEventListener('submit', function (e) {
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
                window.location = "dashboard.html";
            } else {
                alert("Email is not registered or Password is incorrect");
            }
        })
        .catch(err => console.error(err));
});