const express = require("express");
const session = require("express-session");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let totalVisitors = 0;
let onlineUsers = 0;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "geheim",
  resave: false,
  saveUninitialized: true,
}));

// Besucher nur zählen, wenn von Startseite "/"
app.get("/", (req, res) => {
  if (!req.session.hasVisited) {
    totalVisitors++;
    req.session.hasVisited = true;
  }
  res.render("index", { totalVisitors });
});

// Beispiel-Routen
app.get("/admin", (req, res) => res.send("Admin-Bereich"));
app.get("/creator", (req, res) => res.send("Creator-Bereich"));

io.on("connection", (socket) => {
  onlineUsers++;
  io.emit("updateOnlineUsers", onlineUsers);

  socket.on("disconnect", () => {
    onlineUsers--;
    io.emit("updateOnlineUsers", onlineUsers);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
