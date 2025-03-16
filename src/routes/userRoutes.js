const express = require('express');
const router = express.Router();
const db = require('../../models');
const { User, Item } = db;

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt']
        });
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Create a user
router.post('/', async (req, res) => {
    try {
        const { username, firstName, lastName, email } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        const user = await User.create({
            username,
            firstName,
            lastName,
            email
        });
        
        res.status(201).json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Get a user with their inventory
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            include: [{ model: Item }]
        });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Delete a user (cascade deletes their items)
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const authenticatedUserId = req.user.id;

        // Check if the authenticated user is the same as the user to be deleted
        if (userId !== authenticatedUserId) {
            return res.status(403).json({ error: 'You can only delete your own account' });
        }

        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        await user.destroy();
        
        // Notify all clients subscribed to this user's inventory
        req.io.to(`inventory-${userId}`).emit('userDeleted', { userId });
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router; 