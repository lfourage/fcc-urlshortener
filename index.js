require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const URL = require("url").URL;
const dns = require("dns");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

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
  original_url: String,
  short_url: Number,
});

const urlModel = mongoose.model("urlModel", urlSchema);

const generateShortUrl = () => {
  let shortURL = Math.floor(Math.random() * 10000);

  while (urlModel.exists({ short_url: shortURL }))
    shortURL = Math.floor(Math.random() * 10000);
  return shortURL;
};

app.post("/api/shorturl/", (req, res) => {
  const originalURL = req.body.url;
  const shortURL = generateShortUrl();
  let urlObject;

  try {
    urlObject = new URL(originalURL);
  } catch (err) {
    res.json({ error: "Invalid URL" });
  }

  dns.lookup(urlObject.hostname, (err) => {
    if (err) res.json({ error: "Invalid Hostname" });

    if (!urlModel.exists({ original_url: originalURL })) {
      const newUrlModel = new urlModel({
        original_url: originalURL,
        short_url: shortURL,
      });

      newUrlModel.save((err, data) => {
        if (err) console.error(err);
        done(null, data);
      });
    }
    res.json({ original_url: originalURL, short_url: shortURL });
  });
});

// Your first API endpoint
app.get("/api/shorturl/:url", function (req, res) {
  const url = req.params.url;
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
