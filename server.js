const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve everything in /public as static files (index.html, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Fallback: always return index.html (single-page app)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`AyosPoint prototype running on http://localhost:${PORT}`);
});
