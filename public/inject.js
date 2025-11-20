(function () {

    // Hilfsfunktion: wiederholt versuchen, ein Element zu finden
    function clickWhenAvailable(selector) {
        const el = document.querySelector(selector);
        if (el) el.click();
        else setTimeout(() => clickWhenAvailable(selector), 500);
    }

    // Autoplay-Button (Beispiel)
    clickWhenAvailable(".autoplay-btn, .next-btn, button.autoplay");

    // Intro-Skip (Viele Player nutzen ähnliche Button-Klassen)
    setInterval(() => {
        const skip = document.querySelector(
            ".skip-intro, .intro-skip, button.skip, .skip-button"
        );
        if (skip) skip.click();
    }, 1000);

    // Popup-Entfernung
    setInterval(() => {
        document.querySelectorAll(".popup, .modal, .ad, .ads, .overlay")
            .forEach(el => el.remove());
    }, 1500);

    // Entferne full-screen Overlay Ads
    setInterval(() => {
        document.querySelectorAll("[id*='ad'], [class*='ad']")
            .forEach(el => {
                if (el.offsetHeight > 200) el.remove();
            });
    }, 2000);

    console.log("Inject loaded");

})();
