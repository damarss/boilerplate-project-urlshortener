require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const validator = require("valid-url");

try {
  mongoose.connect(process.env["MONGO_URI"]);
  console.log("Database connected");
} catch (err) {
  console.error(err);
}

const urlSchema = mongoose.Schema({
  originalURL: { type: String, required: true },
  shortURL: { type: Number, required: true },
});

const URL = mongoose.model("URL", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.use(express.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.get("/api/shorturl/:shortURL", async (req, res) => {
  const { shortURL } = req.params;
  if (isNaN(shortURL)) {
    res.json({ error: "Wrong format" });
  }
  const url = await URL.findOne({ shortURL: shortURL });
  if (url) {
    res.redirect(url?.originalURL);
  } else {
    res.json({ error: "No short URL found for the given input"});
  }
});

app.post("/api/shorturl", async (req, res) => {
  const { url } = req.body;
  const httpRegex = /^(http|https)(:\/\/)/;
  if (!httpRegex.test(url)) {
    return res.json({ error: 'invalid url' })
  }
  try {
    const existed = await URL.findOne({ originalURL: url });
    let count = await URL.count();
    if (existed) {
      res.json({original_url: existed.originalURL, short_url: existed.shortURL});
    } else {
      const newURL = new URL({
        originalURL: url,
        shortURL: count + 1,
      });
      await newURL.save();
      res.json({original_url: newURL.originalURL, short_url: newURL.shortURL});
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
