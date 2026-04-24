const containerEl = document.querySelector('.container');
const checkboxEl = document.querySelector('.form-container .form-row input[type="checkbox"]');
const nameEl = document.querySelector('.form-container .form-row input[name="name"]');
const emailEl = document.querySelector('.form-container .form-row input[name="email"]');
const passwordEl = document.querySelector('.form-container .form-row input[name="password"]');
const submitBtn = document.querySelector('.form-container .form-row input[type="button"]');




function signup() {

    let form = new FormData();

    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("password", document.getElementById("password").value);

    fetch("http://localhost/Student-Productivity-Hub/backend/signup.php",{
        method:"POST",
        body:form
    })
    .then(res=>res.text())
    .then(msg=>{

        if(msg=="success"){
            window.location = "../index.html";
        }else{
            alert("Invalid Signup");
        }

    });

}