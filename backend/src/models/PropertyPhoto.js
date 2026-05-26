const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PropertyPhoto = sequelize.define('PropertyPhoto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  propertyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'property_id',
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  cloudinaryId: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'cloudinary_id',
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'order_index',
  },
}, {
  tableName: 'property_photos',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at',
});

module.exports = PropertyPhoto;
