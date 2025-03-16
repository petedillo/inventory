const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');

// Create a character
router.post('/', characterController.createCharacter);

// Get all characters for the logged-in user
router.get('/', characterController.getUserCharacters);

// Get a specific character with stats and equipped items
router.get('/:id', characterController.getCharacter);

module.exports = router; 