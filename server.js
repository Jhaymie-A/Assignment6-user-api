const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const jwt = require("jsonwebtoken"); // Optional, but useful for debugging
const userService = require("./user-service.js");
const passport = require("passport");
require("./passport")(passport);

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// Register a new user
app.post("/api/user/register", (req, res) => {
  userService.registerUser(req.body)
    .then((result) => {
      res.json({ message: result.message, token: result.token });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

// Login existing user
app.post("/api/user/login", (req, res) => {
  userService.checkUser(req.body)
    .then((result) => {
      res.json({ message: result.message, token: result.token });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

// Protected Routes – Favourites
app.get("/api/user/favourites", passport.authenticate("jwt", { session: false }), (req, res) => {
  userService.getFavourites(req.user._id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }));
});

app.put("/api/user/favourites/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
  userService.addFavourite(req.user._id, req.params.id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }));
});

app.delete("/api/user/favourites/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
  userService.removeFavourite(req.user._id, req.params.id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }));
});

// Protected Routes – History
app.get("/api/user/history", passport.authenticate("jwt", { session: false }), (req, res) => {
  userService.getHistory(req.user._id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }));
});

app.put("/api/user/history/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
  userService.addHistory(req.user._id, req.params.id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }));
});

app.delete("/api/user/history/:id", passport.authenticate("jwt", { session: false }), (req, res) => {
  userService.removeHistory(req.user._id, req.params.id)
    .then(data => res.json(data))
    .catch(msg => res.status(422).json({ error: msg }));
});

// Connect to MongoDB and start the server
userService.connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });
