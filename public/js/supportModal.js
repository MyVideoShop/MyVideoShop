document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('supportForm');
    const modal = document.getElementById('supportModal');
    const closeModalBtn = document.querySelector('#supportModal .close');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = form.title.value.trim();
        const description = form.description.value.trim();

        const res = await fetch('/support/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description })
        });

        const data = await res.json();

        if (data.success) {
            alert('Nachricht erfolgreich gesendet!');
            form.reset();
            modal.style.display = 'none';
        } else {
            alert('Fehler: ' + data.message);
        }
    });

    // Schließen-Button
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
});
