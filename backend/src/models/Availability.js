const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Availability = sequelize.define('Availability', {
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
  blockedDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'blocked_date',
  },
  reason: {
    type: DataTypes.ENUM('reservation', 'host_block'),
    allowNull: false,
    defaultValue: 'host_block',
  },
  reservationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reservation_id',
  },
}, {
  tableName: 'availability',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at',
});

module.exports = Availability;
