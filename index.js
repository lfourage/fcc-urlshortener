require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const URL = require("url").URL;
const dns = require("dns");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.use(bodyParser.urlencoded({ extended: false }));

// Database

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true },
});

const urlModel = mongoose.model("urlModel", urlSchema);

const generateShortUrl = () => {
  let shortURL = Math.floor(Math.random() * 10000);

  urlModel.exists({ short_url: shortURL }).then((result) => {
    return result ? generateShortUrl() : shortURL;
  });
  return shortURL;
};

app.post("/api/shorturl/", (req, res) => {
  const originalURL = req.body.url;
  let urlObject;

  try {
    urlObject = new URL(originalURL);
  } catch (err) {
    res.json({ error: "invalid url" });
    return ;
  }

  dns.lookup(urlObject.hostname, (err) => {
    if (err) {
      res.json({ error: "Invalid url" });
      return ;
    }

    urlModel
      .findOne({ original_url: originalURL, short_url: { $exists: true } })
      .then((data) => {
        if (!data) {
          const shortURL = generateShortUrl();
          const newUrlModel = new urlModel({
            original_url: originalURL,
            short_url: shortURL,
          });

          newUrlModel.save();
          res.json({ original_url: originalURL, short_url: shortURL });
        } else {
          res.json({ original_url: originalURL, short_url: data.short_url });
        }
      });
  });
});

// Your first API endpoint
//app.get("/", () => {urlModel.deleteMany({})})
app.get("/api/shorturl/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  urlModel.findOne({ short_url: Number(shortURL) }).then((data) => {
    if (!data) res.json({ error: "No short URL found for the given input" });
    else res.redirect(data.original_url);
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
