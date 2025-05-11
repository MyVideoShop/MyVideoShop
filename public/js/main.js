const loginButton = document.getElementById('loginButton');
const loginModal = document.getElementById('loginModal');

loginButton.addEventListener('click', () => {
  loginModal.classList.remove('hidden');
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  const res = await fetch('/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await res.json();
  alert(result.message);
  if (result.redirect) window.location.href = result.redirect;
});
