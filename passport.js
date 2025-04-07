const passportJWT = require("passport-jwt");
const User = require("./models/user"); // adjust path if needed
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

module.exports = (passport) => {
  passport.use(
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
      },
      async (jwt_payload, done) => {
        try {
          const user = await User.findById(jwt_payload._id).exec();
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
};
