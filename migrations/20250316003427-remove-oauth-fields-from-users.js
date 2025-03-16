'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove OAuth-related columns from users table
    await queryInterface.removeColumn('Users', 'oauthProvider');
    await queryInterface.removeColumn('Users', 'oauthId');
    
    // Make password required (not nullable)
    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: false
    });
  },

  async down (queryInterface, Sequelize) {
    // Add OAuth-related columns back to users table
    await queryInterface.addColumn('Users', 'oauthProvider', {
      type: Sequelize.ENUM('local', 'discord'),
      defaultValue: 'local'
    });
    
    await queryInterface.addColumn('Users', 'oauthId', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    // Make password nullable again for OAuth users
    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
