const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const DiscordStrategy = require('passport-discord').Strategy;
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

  // Discord OAuth Strategy
  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    passport.use(
      new DiscordStrategy(
        {
          clientID: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET,
          callbackURL: process.env.DISCORD_CALLBACK_URL || '/auth/discord/callback',
          scope: ['identify', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Find or create user
            let user = await User.findOne({
              where: {
                oauthProvider: 'discord',
                oauthId: profile.id
              }
            });

            if (!user) {
              // Create new user from Discord profile
              user = await User.create({
                username: `discord_${profile.id}`,
                email: profile.email,
                firstName: profile.username,
                oauthProvider: 'discord',
                oauthId: profile.id
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error, false);
          }
        }
      )
    );
  }
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