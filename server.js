import express from "express";
import axios from "axios";
import cheerio from "cheerio";

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy-Route
app.get("/p/*", async (req, res) => {
    const target = decodeURIComponent(req.params[0]);

    try {
        const { data } = await axios.get(target, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        const $ = cheerio.load(data);

        // Werbung / Redirect-Skripte entfernen
        $("script").each((_, el) => {
            const t = $(el).html() || "";
            if (
                t.includes("window.open") ||
                t.includes("location.href") ||
                t.includes("popunder") ||
                t.includes("popup")
            ) {
                $(el).remove();
            }
        });

        // Links → Proxy umbauen
        $("a").each((_, el) => {
            const href = $(el).attr("href");
            if (!href) return;

            if (href.startsWith("/")) {
                $(el).attr("href", "/p/" + encodeURIComponent("https://aniworld.to" + href));
            } else if (href.startsWith("https://aniworld")) {
                $(el).attr("href", "/p/" + encodeURIComponent(href));
            }
        });

        // Autoplay-Script einfügen
        $("body").append(`
            <script>
                // INTRO-SKIP (30s)
                setInterval(() => {
                    const v = document.querySelector("video");
                    if (!v) return;
                    if (v.currentTime < 5) v.currentTime = 30;
                }, 2000);

                // AUTONEXT (5–10s vor Outro-Ende)
                const next = document.querySelector("a.next_episode")?.href;
                setInterval(() => {
                    const v = document.querySelector("video");
                    if (!v || !next) return;

                    if (v.duration - v.currentTime < 10) {
                        window.location.href = next;
                    }
                }, 1500);

                // Skip-Intro Button
                const btn = document.createElement("button");
                btn.innerText = "Intro überspringen";
                btn.style.position = "fixed";
                btn.style.bottom = "20px";
                btn.style.right = "20px";
                btn.style.padding = "10px 16px";
                btn.style.zIndex = 9999;
                btn.onclick = () => {
                    const v = document.querySelector("video");
                    if (v) v.currentTime = 30;
                };
                document.body.appendChild(btn);
            </script>
        `);

        res.send($.html());
    } catch (e) {
        res.send("Fehler");
    }
});

// Start
app.listen(PORT, () => console.log("OK"));
