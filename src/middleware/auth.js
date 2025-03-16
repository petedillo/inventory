const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const db = require('../../models');
const { User } = db;

// Load environment variables
require('dotenv').config();

// JWT options
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
};

// Initialize passport strategies
const initializePassport = () => {
  // JWT Strategy for token validation
  passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        const user = await User.findByPk(payload.id);
        
        if (!user) {
          return done(null, false);
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    })
  );
};

// Middleware to authenticate JWT
const authenticateJWT = passport.authenticate('jwt', { session: false });

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = {
  initializePassport,
  authenticateJWT,
  isAuthenticated
}; 