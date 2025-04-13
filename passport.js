const passportJWT = require("passport-jwt");
const User = require("./user"); // Your Mongoose model
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

module.exports = (passport) => {
  passport.use(
    new JWTStrategy(
      {
        // ✅ Accept "Authorization: JWT <token>" from client
        jwtFromRequest: ExtractJWT.fromAuthHeaderWithScheme("jwt"),
        secretOrKey: process.env.JWT_SECRET,
      },
      async (jwt_payload, done) => {
        try {
          // ✅ Find user by _id inside the token payload
          const user = await User.findById(jwt_payload._id).exec();
          if (user) {
            return done(null, user); // User found, continue
          } else {
            return done(null, false); // No user, unauthorized
          }
        } catch (err) {
          return done(err, false); // Error in DB lookup
        }
      }
    )
  );
};
