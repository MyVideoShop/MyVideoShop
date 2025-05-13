document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('loginButton');
  const supportButton = document.getElementById('supportButton');
  const loginModal = document.getElementById('loginModal');
  const supportModal = document.getElementById('supportModal');
  const loginForm = document.getElementById('loginForm');
  const formMessage = document.getElementById('formMessage');

  let currentAction = '';

  loginButton?.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
  });

  supportButton?.addEventListener('click', () => {
    supportModal.classList.remove('hidden');
  });

  const buttons = loginForm.querySelectorAll('button[type="submit"]');
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      currentAction = e.target.value;
    });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    data.action = currentAction;
    formMessage.textContent = '';

    if (data.action === 'apply' && !data.email) {
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
      formMessage.textContent = result.message;

      if (result.redirect) {
        window.location.href = result.redirect;
      }
    } catch (err) {
      formMessage.textContent = 'Ein Fehler ist aufgetreten.';
    }
  });
});
