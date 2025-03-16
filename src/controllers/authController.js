const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../models');
const { User, Character, Item } = db;

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
    const { username, email, password, firstName, lastName, characterClass = 'Warrior' } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Validate character class if provided
    if (characterClass && !['Mage', 'Warrior', 'Archer'].includes(characterClass)) {
      return res.status(400).json({ error: 'Character class must be Mage, Warrior, or Archer' });
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
      refreshToken
    });
    
    // Create default character based on chosen class
    const character = await Character.create({
      name: `${username}'s ${characterClass}`,
      class: characterClass,
      userId: user.id
    });
    
    // Create starter item based on class
    let starterItem;
    switch (characterClass) {
      case 'Mage':
        starterItem = await Item.create({
          name: 'Broken Wand',
          description: 'A wand that has seen better days',
          intelligenceBuff: 2,
          userId: user.id,
          characterId: character.id
        });
        break;
      case 'Warrior':
        starterItem = await Item.create({
          name: 'Old Sword',
          description: 'A rusty but functional sword',
          strengthBuff: 2,
          userId: user.id,
          characterId: character.id
        });
        break;
      case 'Archer':
        starterItem = await Item.create({
          name: 'Goblin Bow',
          description: 'A crude bow taken from a goblin',
          agilityBuff: 2,
          userId: user.id,
          characterId: character.id
        });
        break;
    }
    
    // Generate access token
    const token = generateToken(user);
    
    // Return user, character, and tokens
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      character: {
        id: character.id,
        name: character.name,
        class: character.class,
        stats: {
          strength: character.strength + (starterItem.strengthBuff || 0),
          agility: character.agility + (starterItem.agilityBuff || 0),
          intelligence: character.intelligence + (starterItem.intelligenceBuff || 0)
        },
        equippedItems: [starterItem]
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
  refreshToken,
  logout
}; 