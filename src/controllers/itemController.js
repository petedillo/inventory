const db = require('../../models');
const { Item, User, Character } = db;

// Create an item for a user
exports.createItem = async (req, res) => {
    try {
        const { name, description, strengthBuff, agilityBuff, intelligenceBuff } = req.body;
        const userId = req.user.id;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        const item = await Item.create({
            name,
            description,
            strengthBuff: strengthBuff || 0,
            agilityBuff: agilityBuff || 0,
            intelligenceBuff: intelligenceBuff || 0,
            userId
        });
        
        // Notify all clients subscribed to this user's inventory
        req.io.to(`user-${userId}`).emit('itemAdded', item);
        
        res.status(201).json(item);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
};

// Get a single item
exports.getItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.user.id;
        
        const item = await Item.findOne({
            where: { id: itemId, userId },
            include: [
                { model: User, attributes: ['id', 'username'] },
                { model: Character, as: 'equippedTo', attributes: ['id', 'name', 'class'] }
            ]
        });
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
};

// Update an item
exports.updateItem = async (req, res) => {
    try {
        const { name, description, strengthBuff, agilityBuff, intelligenceBuff } = req.body;
        const itemId = req.params.id;
        const userId = req.user.id;
        
        const item = await Item.findOne({
            where: { id: itemId, userId }
        });
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        // Update item
        await item.update({
            name: name || item.name,
            description: description !== undefined ? description : item.description,
            strengthBuff: strengthBuff !== undefined ? strengthBuff : item.strengthBuff,
            agilityBuff: agilityBuff !== undefined ? agilityBuff : item.agilityBuff,
            intelligenceBuff: intelligenceBuff !== undefined ? intelligenceBuff : item.intelligenceBuff
        });
        
        // If item is equipped, update character stats
        if (item.characterId) {
            // Notify clients about the updated item and character stats
            const character = await Character.findByPk(item.characterId, {
                include: [{ model: Item, as: 'equippedItems' }]
            });
            
            if (character) {
                // Calculate total stats
                const totalStats = {
                    strength: character.strength,
                    agility: character.agility,
                    intelligence: character.intelligence
                };
                
                character.equippedItems.forEach(equippedItem => {
                    totalStats.strength += equippedItem.strengthBuff || 0;
                    totalStats.agility += equippedItem.agilityBuff || 0;
                    totalStats.intelligence += equippedItem.intelligenceBuff || 0;
                });
                
                req.io.to(`user-${userId}`).emit('characterUpdate', {
                    characterId: character.id,
                    stats: totalStats,
                    equippedItems: character.equippedItems
                });
            }
        }
        
        // Notify all clients subscribed to this user's inventory
        req.io.to(`user-${userId}`).emit('itemUpdated', item);
        
        res.json(item);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
};

// Delete an item
exports.deleteItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.user.id;
        
        const item = await Item.findOne({
            where: { id: itemId, userId }
        });
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        const characterId = item.characterId;
        
        await item.destroy();
        
        // If item was equipped, update character stats
        if (characterId) {
            const character = await Character.findByPk(characterId, {
                include: [{ model: Item, as: 'equippedItems' }]
            });
            
            if (character) {
                // Calculate total stats
                const totalStats = {
                    strength: character.strength,
                    agility: character.agility,
                    intelligence: character.intelligence
                };
                
                character.equippedItems.forEach(equippedItem => {
                    totalStats.strength += equippedItem.strengthBuff || 0;
                    totalStats.agility += equippedItem.agilityBuff || 0;
                    totalStats.intelligence += equippedItem.intelligenceBuff || 0;
                });
                
                req.io.to(`user-${userId}`).emit('characterUpdate', {
                    characterId: character.id,
                    stats: totalStats,
                    equippedItems: character.equippedItems
                });
            }
        }
        
        // Notify all clients subscribed to this user's inventory
        req.io.to(`user-${userId}`).emit('itemDeleted', { itemId, userId });
        
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
};

// Equip an item to a character
exports.equipItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const characterId = req.params.characterId;
        const userId = req.user.id;
        
        // Verify item belongs to user
        const item = await Item.findOne({
            where: { id: itemId, userId }
        });
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        // Verify character belongs to user
        const character = await Character.findOne({
            where: { id: characterId, userId },
            include: [{ model: Item, as: 'equippedItems' }]
        });
        
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        // Update item to be equipped
        await item.update({ characterId });
        
        // Calculate total stats after equipping
        const totalStats = {
            strength: character.strength,
            agility: character.agility,
            intelligence: character.intelligence
        };
        
        // Add the newly equipped item to the list
        const updatedEquippedItems = [...character.equippedItems, item];
        
        updatedEquippedItems.forEach(equippedItem => {
            totalStats.strength += equippedItem.strengthBuff || 0;
            totalStats.agility += equippedItem.agilityBuff || 0;
            totalStats.intelligence += equippedItem.intelligenceBuff || 0;
        });
        
        // Notify clients about the updated character stats
        req.io.to(`user-${userId}`).emit('characterUpdate', {
            characterId,
            stats: totalStats,
            equippedItems: updatedEquippedItems
        });
        
        res.json({
            message: 'Item equipped successfully',
            item,
            character: {
                ...character.toJSON(),
                totalStats
            }
        });
    } catch (error) {
        console.error('Error equipping item:', error);
        res.status(500).json({ error: 'Failed to equip item' });
    }
};

// Unequip an item from a character
exports.unequipItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.user.id;
        
        // Verify item belongs to user and is equipped
        const item = await Item.findOne({
            where: { id: itemId, userId }
        });
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        if (!item.characterId) {
            return res.status(400).json({ error: 'Item is not equipped' });
        }
        
        const characterId = item.characterId;
        
        // Verify character belongs to user
        const character = await Character.findOne({
            where: { id: characterId, userId },
            include: [{ model: Item, as: 'equippedItems' }]
        });
        
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        // Update item to be unequipped
        await item.update({ characterId: null });
        
        // Calculate total stats after unequipping
        const totalStats = {
            strength: character.strength,
            agility: character.agility,
            intelligence: character.intelligence
        };
        
        // Remove the unequipped item from the list
        const updatedEquippedItems = character.equippedItems.filter(
            equippedItem => equippedItem.id !== itemId
        );
        
        updatedEquippedItems.forEach(equippedItem => {
            totalStats.strength += equippedItem.strengthBuff || 0;
            totalStats.agility += equippedItem.agilityBuff || 0;
            totalStats.intelligence += equippedItem.intelligenceBuff || 0;
        });
        
        // Notify clients about the updated character stats
        req.io.to(`user-${userId}`).emit('characterUpdate', {
            characterId,
            stats: totalStats,
            equippedItems: updatedEquippedItems
        });
        
        res.json({
            message: 'Item unequipped successfully',
            item,
            character: {
                ...character.toJSON(),
                totalStats
            }
        });
    } catch (error) {
        console.error('Error unequipping item:', error);
        res.status(500).json({ error: 'Failed to unequip item' });
    }
};

// Get all equipped items for a character
exports.getEquippedItems = async (req, res) => {
    try {
        const characterId = req.params.characterId;
        const userId = req.user.id;
        
        // Verify character belongs to user
        const character = await Character.findOne({
            where: { id: characterId, userId }
        });
        
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        // Get all equipped items
        const equippedItems = await Item.findAll({
            where: { characterId, userId }
        });
        
        res.json(equippedItems);
    } catch (error) {
        console.error('Error fetching equipped items:', error);
        res.status(500).json({ error: 'Failed to fetch equipped items' });
    }
}; 