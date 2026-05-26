const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
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
  payerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'payer_id',
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
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
  stripePaymentIntentId: {
    type: DataTypes.STRING(200),
    allowNull: false,
    unique: true,
    field: 'stripe_payment_intent_id',
  },
  stripeTransferId: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'stripe_transfer_id',
  },
  stripeChargeId: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'stripe_charge_id',
  },
  status: {
    type: DataTypes.ENUM('pending', 'authorized', 'released', 'refunded', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'paid_at',
  },
  releasedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'released_at',
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'refunded_at',
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'refund_amount',
  },
  stripeRefundId: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'stripe_refund_id',
  },
  receiptUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'receipt_url',
  },
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Payment;
