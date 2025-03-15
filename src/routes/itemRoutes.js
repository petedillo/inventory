const express = require('express');
const router = express.Router();
const db = require('../../models');
const { Item, User } = db;

// Create an item for a user
router.post('/', async (req, res) => {
    try {
        const { name, description, userId } = req.body;
        
        if (!name || !userId) {
            return res.status(400).json({ error: 'Name and userId are required' });
        }
        
        // Check if user exists
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const item = await Item.create({
            name,
            description,
            userId
        });
        
        // Notify all clients subscribed to this user's inventory
        req.io.to(`inventory-${userId}`).emit('itemAdded', item);
        
        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// Get a single item
router.get('/:id', async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id, {
            include: [{ model: User, attributes: ['id', 'username'] }]
        });
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
});

// Update an item
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        const item = await Item.findByPk(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        // Update item
        await item.update({
            name: name || item.name,
            description: description !== undefined ? description : item.description
        });
        
        // Notify all clients subscribed to this user's inventory
        req.io.to(`inventory-${item.userId}`).emit('itemUpdated', item);
        
        res.json(item);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete an item
router.delete('/:id', async (req, res) => {
    try {
        const item = await Item.findByPk(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        const userId = item.userId;
        
        await item.destroy();
        
        // Notify all clients subscribed to this user's inventory
        req.io.to(`inventory-${userId}`).emit('itemDeleted', { itemId: req.params.id, userId });
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

module.exports = router; 