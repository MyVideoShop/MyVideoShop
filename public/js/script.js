document.addEventListener("DOMContentLoaded", function () {
  const loginModal = document.getElementById("loginModal");
  const loginBtn = document.getElementById("loginBtn");
  const closeModal = document.querySelector(".close");
  const loginTypeInputs = document.querySelectorAll('input[name="loginType"]');
  const loginTitle = document.getElementById("loginTitle");

  // Öffnen
  loginBtn.addEventListener("click", () => {
    loginModal.style.display = "block";
    setTimeout(() => loginModal.classList.add("show"), 10);
  });

  // Schließen über X
  closeModal.addEventListener("click", () => {
    loginModal.classList.remove("show");
    setTimeout(() => loginModal.style.display = "none", 200);
  });

  // Schließen bei Klick außerhalb
  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      loginModal.classList.remove("show");
      setTimeout(() => loginModal.style.display = "none", 200);
    }
  });

  // ESC zum Schließen
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      loginModal.classList.remove("show");
      setTimeout(() => loginModal.style.display = "none", 200);
    }
  });

  // Titel dynamisch ändern
  loginTypeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      loginTitle.textContent = input.value === "login" ? "Login" : "Als Creator bewerben";
    });
  });
});
