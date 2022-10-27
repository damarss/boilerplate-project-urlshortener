require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("dns");
const shortId = require("shortid");
const mongoose = require("mongoose");
const validator = require("valid-url");
const { Schema } = mongoose;

try {
  mongoose.connect(process.env["MONGO_URI"]);
  console.log("Database connected");
} catch (err) {
  console.error(err);
}

const urlSchema = mongoose.Schema({
  originalURL: { type: String, required: true },
  shortURL: { type: String, required: true },
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
  const url = await URL.findOne({ shortURL: shortURL });
  if (url) {
    res.redirect(url?.originalURL);
  } else {
    res.json({ error: "Wrong format" });
  }
});

app.post("/api/shorturl", async (req, res) => {
  const { url } = req.body;
  if (!validator.isUri(url)) {
    res.status(401).json({
      error: "Invalid URL",
    });
  } else {
    try {
      const existed = await URL.findOne({ originalURL: url });
      if (existed) {
        res.json(existed);
      } else {
        const newURL = new URL({
          originalURL: url,
          shortURL: shortId.generate(),
        });
        await newURL.save();
        res.json(newURL);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
