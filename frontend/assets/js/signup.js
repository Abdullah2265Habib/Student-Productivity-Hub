const containerEl = document.querySelector('.container');
const checkboxEl = document.querySelector('.form-container .form-row input[type="checkbox"]');
const nameEl = document.querySelector('.form-container .form-row input[name="name"]');
const emailEl = document.querySelector('.form-container .form-row input[name="email"]');
const passwordEl = document.querySelector('.form-container .form-row input[name="password"]');
const submitBtn = document.querySelector('.form-container .form-row input[type="button"]');




// Toggle password visibility
document.getElementById('signup-eye').addEventListener('click', function () {
    const passInput = document.getElementById('password');
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

// Signup function (preserved from original)
function signup() {
    let form = new FormData();

    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("password", document.getElementById("password").value);

    fetch("../../backend/signup.php", {
        method: "POST",
        body: form
    })
        .then(res => res.text())
        .then(msg => {
            if (msg == "success") {
                window.location = "../../index.html";
            } else {
                alert("Email already registered");
            }
        });
}