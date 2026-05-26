const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
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
  guestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'guest_id',
  },
  checkIn: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'check_in',
  },
  checkOut: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'check_out',
  },
  guestsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'guests_count',
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price',
  },
  platformFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'platform_fee',
  },
  hostPayout: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'host_payout',
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  guestNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'guest_notes',
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at',
  },
  cancelReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'cancel_reason',
  },
  cancelledBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'cancelled_by',
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'refund_amount',
  },
}, {
  tableName: 'reservations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Reservation;
