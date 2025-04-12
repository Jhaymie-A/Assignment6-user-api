const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let mongoDBConnectionString = process.env.MONGO_URL;

let Schema = mongoose.Schema;

let userSchema = new Schema({
  userName: {
    type: String,
    unique: true
  },
  password: String,
  favourites: [String],
  history: [String]
});

let User;

module.exports.connect = function () {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(mongoDBConnectionString);

    db.on('error', (err) => {
      console.error("DB Connection Error:", err);
      reject(err);
    });

    db.once('open', () => {
      User = db.model("users", userSchema);
      console.log("MongoDB connection successful");
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
      return;
    }

    bcrypt.hash(userData.password, 10).then((hash) => {
      let newUser = new User({
        userName: userData.userName,
        password: hash,
        favourites: [],
        history: []
      });

      newUser.save()
        .then((user) => {
          const payload = { _id: user._id, userName: user.userName };
          const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
          resolve({ message: `User ${user.userName} successfully registered`, token });
        })
        .catch((err) => {
          console.error("Error creating user:", err);
          if (err.code === 11000) {
            reject("User Name already taken");
          } else {
            reject("There was an error creating the user: " + err.message);
          }
        });

    }).catch((err) => {
      console.error("Bcrypt error:", err);
      reject("There was an error encrypting the password.");
    });
  });
};

module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName }).exec()
      .then((user) => {
        if (!user) {
          reject("Unable to find user " + userData.userName);
          return;
        }

        bcrypt.compare(userData.password, user.password).then((res) => {
          if (res === true) {
            const payload = { _id: user._id, userName: user.userName };
            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
            resolve({ message: "Login successful", token });
          } else {
            reject("Incorrect password for user " + userData.userName);
          }
        });

      })
      .catch((err) => {
        console.error("Login check failed:", err);
        const safeMessage = typeof err === "string" ? err : (err.message || JSON.stringify(err));
        reject(safeMessage);
      });
  });
};

module.exports.getFavourites = function (id) {
  return new Promise((resolve, reject) => {
    User.findById(id).exec()
      .then((user) => resolve(user.favourites))
      .catch(() => reject(`Unable to get favourites for user with id: ${id}`));
  });
};

module.exports.addFavourite = function (id, favId) {
  return new Promise((resolve, reject) => {
    User.findById(id).exec().then((user) => {
      if (user.favourites.length < 50) {
        User.findByIdAndUpdate(
          id,
          { $addToSet: { favourites: favId } },
          { new: true }
        ).exec()
          .then((user) => resolve(user.favourites))
          .catch(() => reject(`Unable to update favourites for user with id: ${id}`));
      } else {
        reject(`Favourites limit reached (50) for user with id: ${id}`);
      }
    });
  });
};

module.exports.removeFavourite = function (id, favId) {
  return new Promise((resolve, reject) => {
    User.findByIdAndUpdate(
      id,
      { $pull: { favourites: favId } },
      { new: true }
    ).exec()
      .then((user) => resolve(user.favourites))
      .catch(() => reject(`Unable to update favourites for user with id: ${id}`));
  });
};

module.exports.getHistory = function (id) {
  return new Promise((resolve, reject) => {
    User.findById(id).exec()
      .then((user) => resolve(user.history))
      .catch(() => reject(`Unable to get history for user with id: ${id}`));
  });
};

module.exports.addHistory = function (id, historyId) {
  return new Promise((resolve, reject) => {
    User.findById(id).exec().then((user) => {
      if (user.history.length < 50) {
        User.findByIdAndUpdate(
          id,
          { $addToSet: { history: historyId } },
          { new: true }
        ).exec()
          .then((user) => resolve(user.history))
          .catch(() => reject(`Unable to update history for user with id: ${id}`));
      } else {
        reject(`History limit reached (50) for user with id: ${id}`);
      }
    });
  });
};

module.exports.removeHistory = function (id, historyId) {
  return new Promise((resolve, reject) => {
    User.findByIdAndUpdate(
      id,
      { $pull: { history: historyId } },
      { new: true }
    ).exec()
      .then((user) => resolve(user.history))
      .catch(() => reject(`Unable to update history for user with id: ${id}`));
  });
};
