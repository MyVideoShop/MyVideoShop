document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('supportForm');
    const modal = document.getElementById('supportModal');
    const closeModalBtn = document.getElementById('closeSupportModal');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = form.title.value.trim();
        const description = form.description.value.trim();

        try {
            const res = await fetch('/support/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });

            const data = await res.json();

            if (data.success) {
                alert('Nachricht erfolgreich gesendet!');
                form.reset();
                modal.classList.add('hidden');
            } else {
                alert('Fehler: ' + data.message);
            }
        } catch (err) {
            console.error('Fehler beim Senden:', err);
            alert('Serverfehler. Bitte später erneut versuchen.');
        }
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
});
