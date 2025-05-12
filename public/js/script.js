document.addEventListener("DOMContentLoaded", function () {
  const loginModal = document.getElementById("loginModal");
  const loginBtn = document.getElementById("loginBtn");
  const closeModal = document.querySelector(".close");
  const loginTypeInputs = document.querySelectorAll('input[name="loginType"]');
  const loginTitle = document.getElementById("loginTitle");

  loginBtn.addEventListener("click", () => {
    loginModal.style.display = "block";
  });

  closeModal.addEventListener("click", () => {
    loginModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      loginModal.style.display = "none";
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      loginModal.style.display = "none";
    }
  });

  loginTypeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      loginTitle.textContent = input.value === "login" ? "Login" : "Als Creator bewerben";
    });
  });
});
