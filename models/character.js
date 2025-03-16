'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Character extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Character.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE'
      });
      Character.hasMany(models.Item, {
        foreignKey: 'characterId',
        as: 'equippedItems'
      });
    }
  }
  Character.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    class: {
      type: DataTypes.ENUM('Mage', 'Warrior', 'Archer'),
      allowNull: false
    },
    strength: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    agility: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    intelligence: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Character',
  });
  return Character;
}; 