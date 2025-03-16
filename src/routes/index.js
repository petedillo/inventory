const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const itemRoutes = require('./itemRoutes');
const authRoutes = require('./authRoutes');
const characterRoutes = require('./characterRoutes');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', (req, res) => {
    res.send('Inventory API is running');
});

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/users', isAuthenticated, userRoutes);
router.use('/items', isAuthenticated, itemRoutes);
router.use('/characters', isAuthenticated, characterRoutes);

module.exports = router;