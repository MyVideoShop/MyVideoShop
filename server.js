import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// static front-end
app.use(express.static(path.join(__dirname, "public")));

// simple test route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// proxy-cleaner (remove ads + redirect blockers)
app.get("/clean", async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send("Missing url");

    const html = (await axios.get(url)).data;
    const $ = cheerio.load(html);

    // remove iframe-ads
    $("iframe").remove();
    $("script[src*='ad']").remove();
    $("div[id*='ad'], div[class*='ad']").remove();

    res.send($.html());
  } catch (e) {
    res.status(500).send("Error");
  }
});

app.listen(PORT, () => console.log("OK"));
