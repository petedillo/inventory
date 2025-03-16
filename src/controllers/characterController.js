const db = require('../../models');
const { Character, Item, User } = db;

// Create a character with a starter item based on class
exports.createCharacter = async (req, res) => {
    try {
        const { name, class: characterClass } = req.body;
        const userId = req.user.id;

        if (!name || !characterClass) {
            return res.status(400).json({ error: 'Name and class are required' });
        }

        if (!['Mage', 'Warrior', 'Archer'].includes(characterClass)) {
            return res.status(400).json({ error: 'Class must be Mage, Warrior, or Archer' });
        }

        // Create character
        const character = await Character.create({
            name,
            class: characterClass,
            userId
        });

        // Create starter item based on class
        let starterItem;
        switch (characterClass) {
            case 'Mage':
                starterItem = await Item.create({
                    name: 'Broken Wand',
                    description: 'A wand that has seen better days',
                    intelligenceBuff: 2,
                    userId,
                    characterId: character.id
                });
                break;
            case 'Warrior':
                starterItem = await Item.create({
                    name: 'Old Sword',
                    description: 'A rusty but functional sword',
                    strengthBuff: 2,
                    userId,
                    characterId: character.id
                });
                break;
            case 'Archer':
                starterItem = await Item.create({
                    name: 'Goblin Bow',
                    description: 'A crude bow taken from a goblin',
                    agilityBuff: 2,
                    userId,
                    characterId: character.id
                });
                break;
        }

        // Notify clients about the new character
        req.io.to(`user-${userId}`).emit('characterCreated', {
            character,
            equippedItems: [starterItem]
        });

        res.status(201).json({
            character,
            equippedItems: [starterItem]
        });
    } catch (error) {
        console.error('Error creating character:', error);
        res.status(500).json({ error: 'Failed to create character' });
    }
};

// Get all characters for the logged-in user
exports.getUserCharacters = async (req, res) => {
    try {
        const userId = req.user.id;

        const characters = await Character.findAll({
            where: { userId },
            include: [{
                model: Item,
                as: 'equippedItems'
            }]
        });

        res.json(characters);
    } catch (error) {
        console.error('Error fetching characters:', error);
        res.status(500).json({ error: 'Failed to fetch characters' });
    }
};

// Get a specific character with equipped items and calculated stats
exports.getCharacter = async (req, res) => {
    try {
        const characterId = req.params.id;
        const userId = req.user.id;

        const character = await Character.findOne({
            where: { id: characterId, userId },
            include: [{
                model: Item,
                as: 'equippedItems'
            }]
        });

        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }

        // Calculate total stats including equipment buffs
        const totalStats = {
            strength: character.strength,
            agility: character.agility,
            intelligence: character.intelligence
        };

        character.equippedItems.forEach(item => {
            totalStats.strength += item.strengthBuff || 0;
            totalStats.agility += item.agilityBuff || 0;
            totalStats.intelligence += item.intelligenceBuff || 0;
        });

        res.json({
            ...character.toJSON(),
            totalStats
        });
    } catch (error) {
        console.error('Error fetching character:', error);
        res.status(500).json({ error: 'Failed to fetch character' });
    }
}; 