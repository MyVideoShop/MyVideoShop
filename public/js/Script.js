document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('loginButton');
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const formMessage = document.getElementById('formMessage');

  // Modal öffnen
  loginButton.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
  });

  // Formular abschicken
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    const action = data.action;

    if (action === 'apply' && !data.email) {
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
      formMessage.textContent = result.message || '';

      if (result.redirect) {
        window.location.href = result.redirect;
      }
    } catch (err) {
      formMessage.textContent = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
    }
  });
});
