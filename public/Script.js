const loginButton = document.getElementById('loginButton');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const formMessage = document.getElementById('formMessage');

loginButton.addEventListener('click', () => {
  loginModal.classList.remove('hidden');
  loginForm.reset();
  formMessage.textContent = '';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  // Zeige eine Nachricht, wenn bei Bewerbung keine E-Mail angegeben wurde
  if (data.action === 'apply' && !data.email.trim()) {
    formMessage.textContent = 'Zum Bewerben wird eine E-Mail benötigt.';
    return;
  }

  try {
    const res = await fetch('/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.redirect) {
      window.location.href = result.redirect;
    } else {
      formMessage.textContent = result.message;
    }
  } catch (error) {
    formMessage.textContent = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
  }
});
