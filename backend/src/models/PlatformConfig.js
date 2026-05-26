const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlatformConfig = sequelize.define('PlatformConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  configKey: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    field: 'config_key',
  },
  configValue: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'config_value',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by',
  },
}, {
  tableName: 'platform_config',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
});

module.exports = PlatformConfig;
