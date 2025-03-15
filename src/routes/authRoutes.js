const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

// Register with email/password
router.post('/register', authController.register);

// Login with email/password
router.post('/login', authController.login);

// Discord OAuth routes
router.get('/discord', passport.authenticate('discord', { scope: ['identify', 'email'] }));
router.get('/discord/callback', 
  passport.authenticate('discord', { session: false, failureRedirect: '/auth/error' }),
  authController.oauthCallback
);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

module.exports = router; 