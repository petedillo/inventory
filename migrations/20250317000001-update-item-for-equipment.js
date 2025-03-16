'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add stat buff columns
    await queryInterface.addColumn('Items', 'strengthBuff', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Items', 'agilityBuff', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('Items', 'intelligenceBuff', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    
    // Add characterId column for equipment functionality
    await queryInterface.addColumn('Items', 'characterId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Characters',
        key: 'id'
      },
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove added columns
    await queryInterface.removeColumn('Items', 'strengthBuff');
    await queryInterface.removeColumn('Items', 'agilityBuff');
    await queryInterface.removeColumn('Items', 'intelligenceBuff');
    await queryInterface.removeColumn('Items', 'characterId');
  }
}; 