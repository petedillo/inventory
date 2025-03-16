const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// Create an item
router.post('/', itemController.createItem);

// Get a single item
router.get('/:id', itemController.getItem);

// Update an item
router.put('/:id', itemController.updateItem);

// Delete an item
router.delete('/:id', itemController.deleteItem);

// Equip an item to a character
router.post('/:id/equip/:characterId', itemController.equipItem);

// Unequip an item
router.post('/:id/unequip', itemController.unequipItem);

// Get all equipped items for a character
router.get('/equipped/:characterId', itemController.getEquippedItems);

module.exports = router; 