const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  reservationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'reservation_id',
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'reviewer_id',
  },
  revieweeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reviewee_id',
  },
  propertyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'property_id',
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: false,
    validate: {
      min: 1.0,
      max: 5.0,
    },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('guest_to_property', 'host_to_guest'),
    allowNull: false,
  },
}, {
  tableName: 'reviews',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at',
});

module.exports = Review;
