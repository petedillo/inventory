'use strict';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create test user
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await queryInterface.bulkInsert('Users', [{
      id: userId,
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    // Create characters for the test user
    const mageId = uuidv4();
    const warriorId = uuidv4();
    const archerId = uuidv4();

    await queryInterface.bulkInsert('Characters', [
      {
        id: mageId,
        name: 'Test Mage',
        class: 'Mage',
        strength: 8,
        agility: 8,
        intelligence: 14,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: warriorId,
        name: 'Test Warrior',
        class: 'Warrior',
        strength: 14,
        agility: 10,
        intelligence: 6,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: archerId,
        name: 'Test Archer',
        class: 'Archer',
        strength: 10,
        agility: 14,
        intelligence: 8,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create starter items for each character
    await queryInterface.bulkInsert('Items', [
      {
        id: uuidv4(),
        name: 'Broken Wand',
        description: 'A wand that has seen better days',
        strengthBuff: 0,
        agilityBuff: 0,
        intelligenceBuff: 2,
        userId: userId,
        characterId: mageId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Apprentice Staff',
        description: 'A basic magical staff',
        strengthBuff: 0,
        agilityBuff: 1,
        intelligenceBuff: 3,
        userId: userId,
        characterId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Old Sword',
        description: 'A rusty but functional sword',
        strengthBuff: 2,
        agilityBuff: 0,
        intelligenceBuff: 0,
        userId: userId,
        characterId: warriorId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Training Shield',
        description: 'A wooden shield for practice',
        strengthBuff: 1,
        agilityBuff: 0,
        intelligenceBuff: 0,
        userId: userId,
        characterId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Goblin Bow',
        description: 'A crude bow taken from a goblin',
        strengthBuff: 0,
        agilityBuff: 2,
        intelligenceBuff: 0,
        userId: userId,
        characterId: archerId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Leather Quiver',
        description: 'A basic quiver for arrows',
        strengthBuff: 0,
        agilityBuff: 1,
        intelligenceBuff: 0,
        userId: userId,
        characterId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Remove all seeded data
    await queryInterface.bulkDelete('Items', null, {});
    await queryInterface.bulkDelete('Characters', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
}; 