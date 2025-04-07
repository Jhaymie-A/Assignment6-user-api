const mongoose = require("mongoose");

// Define the schema for a user
const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  favourites: {
    type: [String],
    default: []
  },
  history: {
    type: [String],
    default: []
  }
});

// Export the model
module.exports = mongoose.model("User", userSchema);
