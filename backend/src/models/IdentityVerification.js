const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IdentityVerification = sequelize.define('IdentityVerification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
  },
  stripeSessionId: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'stripe_session_id',
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'verified', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  documentType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'document_type',
  },
  rejectionReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'rejection_reason',
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'verified_at',
  },
}, {
  tableName: 'identity_verifications',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at',
});

module.exports = IdentityVerification;