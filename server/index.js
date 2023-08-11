const { networkInterfaces } = require("os");
const fs = require("fs");
const express = require("express");
const path = require("path");
const cors = require("cors");

// network
const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
    const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
    if (net.family === familyV4Value && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}

const app = express();
app.use(cors());

app.use(express.static(__dirname + "/public"));
// app.use(express.static(path.join(__dirname, "..", "dist")));
app.use(
  express.static(path.join(__dirname, "processed_videos"), {
    recursive: true,
  })
);

const port = 3000;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/db", (req, res) => {
  const db_path = path.join(__dirname, "database", "db.json");
  const data = fs.readFileSync(db_path, "utf-8");
  res.json({ data: JSON.parse(data) });
});

app.listen(port, () => {
  const ip = results["Wi-Fi"] ? results["Wi-Fi"][0] : "localhost";
  const address = `http://${ip}:${port}`;

  console.log(`yt server address: ${address}`);
});
