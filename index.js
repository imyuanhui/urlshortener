require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// In-memory array to store URLs
const urlDatabase = {};

// Helper function to normalize URL
const normalizeUrl = (url) => {
  return new URL(url).toString().toLowerCase();
};

// Endpoint to create a shortened URL
app.post("/api/shorturl", (req, res) => {
  const { url } = req.body;
  const urlPattern = /^(http|https):\/\/[^ "]+$/;

  // Check if the URL is valid
  if (!urlPattern.test(url)) {
    return res.json({ error: "invalid url" });
  }

  // Extract the hostname from the URL
  const hostname = new URL(url).hostname;

  // Normalize url
  const normalizedUrl = normalizeUrl(url);

  // Verify the hostname using dns.lookup
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    // Check if the normalized URL already exists in the urlList
    if (!urlDatabase[normalizedUrl]) {
      urlDatabase[normalizedUrl] = {
        original_url: normalizedUrl,
        short_url: Object.keys(urlDatabase).length + 1,
      };
    }

    res.json(urlDatabase[normalizedUrl]);
  });
});

// Endpoint to redirect to the original URL
app.get("/api/shorturl/:short_url", (req, res) => {
  const { short_url } = req.params;
  const urlEntry = Object.values(urlDatabase).find(
    (entry) => entry.short_url == short_url
  );

  if (urlEntry) {
    return res.redirect(urlEntry.original_url);
  }

  res.json({ error: "No short URL found for the given input" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
