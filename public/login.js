//jshint esversion:8


const hided = document.querySelectorAll(".hide");

const signUp = document.getElementById("sign-up");

signUp.addEventListener("click", function(){
  for(var i = 0; i < hided.length; i++){
    if (hided[i].classList.contains("hide")) {
      hided[i].classList.remove("hide");
    } else {
      hided[i].classList.add("hide");
    }
  }
});
