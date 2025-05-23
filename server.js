const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const passport = require("passport");
const passportJWT = require("passport-jwt");
const jwt = require("jsonwebtoken");

const userService = require("./user-service.js");

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const HTTP_PORT = process.env.PORT || 8080;

// passport to use JWT strategy 
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderWithScheme("jwt"),
      secretOrKey: process.env.JWT_SECRET,
    },
    (jwt_payload, done) => {
      if (jwt_payload) {
        return done(null, {
          _id: jwt_payload._id,
          userName: jwt_payload.userName,
        });
      } else {
        return done(null, false);
      }
    }
  )
);

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// Route: Register
app.post("/api/user/register", (req, res) => {
  userService
    .registerUser(req.body)
    .then((msg) => res.json({ message: msg }))
    .catch((msg) => res.status(422).json({ message: msg }));
});

// Route: Login (returns JWT)
app.post("/api/user/login", (req, res) => {
  userService
    .checkUser(req.body)
    .then((user) => {
      const payload = {
        _id: user._id,
        userName: user.userName,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET);
      res.json({ message: "login successful", token });
    })
    .catch((msg) => res.status(422).json({ message: msg }));
});

// Protected Routes 
app.get(
  "/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .getFavourites(req.user._id)
      .then((data) => res.json(data))
      .catch((msg) => res.status(422).json({ error: msg }));
  }
);

app.put(
    "/api/user/favourites",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
      const id = req.body.id;
      if (!id) {
        return res.status(400).json({ error: "Missing artwork ID in request body" });
      }
  
      userService
        .addFavourite(req.user._id, id)
        .then((data) => res.json(data))
        .catch((msg) => res.status(422).json({ error: msg }));
    }
  );
  
  
  app.delete(
    "/api/user/favourites/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
      userService
        .removeFavourite(req.user._id, req.params.id)
        .then((data) => res.json(data))
        .catch((msg) => res.status(422).json({ error: msg }));
    }
  );
  

app.get(
  "/api/user/history",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    userService
      .getHistory(req.user._id)
      .then((data) => res.json(data))
      .catch((msg) => res.status(422).json({ error: msg }));
  }
);

app.put("/api/user/history",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
      const historyId = req.body.id; 
      userService
        .addHistory(req.user._id, historyId)
        .then((data) => res.json(data))
        .catch((msg) => res.status(422).json({ error: msg }));
    }
  );
  

  app.delete(
    "/api/user/history",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
      const historyId = req.body.id;
      userService
        .removeHistory(req.user._id, historyId)
        .then((data) => res.json(data))
        .catch((msg) => res.status(422).json({ error: msg }));
    }
  );
  
// Start the server
userService
  .connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });