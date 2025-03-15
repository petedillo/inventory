'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Make email unique and not null
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });

    // Add new authentication fields
    await queryInterface.addColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'oauthProvider', {
      type: Sequelize.ENUM('local', 'discord'),
      defaultValue: 'local'
    });

    await queryInterface.addColumn('Users', 'oauthId', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'refreshToken', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert email changes
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: false
    });

    // Remove added columns
    await queryInterface.removeColumn('Users', 'password');
    await queryInterface.removeColumn('Users', 'oauthProvider');
    await queryInterface.removeColumn('Users', 'oauthId');
    await queryInterface.removeColumn('Users', 'refreshToken');

    // Remove the ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_oauthProvider";');
  }
};
