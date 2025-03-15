const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../models');
const { User } = db;

// Load environment variables
require('dotenv').config();

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h'; // 1 hour
const REFRESH_TOKEN_EXPIRATION = process.env.REFRESH_TOKEN_EXPIRATION || '7d'; // 7 days

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        email
      }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Create refresh token
    const refreshToken = generateRefreshToken();
    
    // Create user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by the model hook
      firstName,
      lastName,
      oauthProvider: 'local',
      refreshToken
    });
    
    // Generate access token
    const token = generateToken(user);
    
    // Return user and tokens
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Error registering user:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login with email and password
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const user = await User.findOne({
      where: {
        email
      }
    });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Check if user is using local auth
    if (user.oauthProvider !== 'local') {
      return res.status(400).json({ 
        error: `This account uses ${user.oauthProvider} authentication. Please sign in with ${user.oauthProvider}.` 
      });
    }
    
    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate new refresh token
    const refreshToken = generateRefreshToken();
    
    // Update user's refresh token
    await user.update({ refreshToken });
    
    // Generate access token
    const token = generateToken(user);
    
    // Return user and tokens
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token,
      refreshToken
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Handle OAuth login/register (called after passport authentication)
const oauthCallback = (req, res) => {
  try {
    // User is already authenticated by passport
    const user = req.user;
    
    // Generate new refresh token
    const refreshToken = generateRefreshToken();
    
    // Update user's refresh token
    user.update({ refreshToken });
    
    // Generate access token
    const token = generateToken(user);
    
    // Redirect to frontend with tokens
    // In a real app, you might want to use a more secure approach
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&refreshToken=${refreshToken}&userId=${user.id}`);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error`);
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Find user by refresh token
    const user = await User.findOne({
      where: {
        refreshToken
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new access token
    const token = generateToken(user);
    
    // Return new access token
    res.json({
      token
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Find user by refresh token
    const user = await User.findOne({
      where: {
        refreshToken
      }
    });
    
    if (user) {
      // Clear refresh token
      await user.update({ refreshToken: null });
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};

module.exports = {
  register,
  login,
  oauthCallback,
  refreshToken,
  logout
}; 