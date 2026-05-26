

const sequelize = require('../config/database');
const User = require('./User');
const IdentityVerification = require('./IdentityVerification');
const Property = require('./Property');
const PropertyPhoto = require('./PropertyPhoto');
const Availability = require('./Availability');
const Reservation = require('./Reservation');
const Payment = require('./Payment');
const Message = require('./Message');
const Review = require('./Review');
const Notification = require('./Notification');
const PlatformConfig = require('./PlatformConfig');


User.hasMany(Property, { foreignKey: 'hostId', as: 'properties' });
User.hasMany(IdentityVerification, { foreignKey: 'userId', as: 'verifications' });
User.hasMany(Reservation, { foreignKey: 'guestId', as: 'reservations' });
User.hasMany(Payment, { foreignKey: 'payerId', as: 'payments' });
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
User.hasMany(Review, { foreignKey: 'reviewerId', as: 'writtenReviews' });
User.hasMany(Review, { foreignKey: 'revieweeId', as: 'receivedReviews' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });


IdentityVerification.belongsTo(User, { foreignKey: 'userId', as: 'user' });


Property.belongsTo(User, { foreignKey: 'hostId', as: 'host' });
Property.hasMany(PropertyPhoto, { foreignKey: 'propertyId', as: 'photos' });
Property.hasMany(Availability, { foreignKey: 'propertyId', as: 'availabilities' });
Property.hasMany(Reservation, { foreignKey: 'propertyId', as: 'reservations' });
Property.hasMany(Review, { foreignKey: 'propertyId', as: 'reviews' });


PropertyPhoto.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });


Availability.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
Availability.belongsTo(Reservation, { foreignKey: 'reservationId', as: 'reservation' });


Reservation.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
Reservation.belongsTo(User, { foreignKey: 'guestId', as: 'guest' });
Reservation.belongsTo(User, { foreignKey: 'cancelledBy', as: 'canceller' });
Reservation.hasOne(Payment, { foreignKey: 'reservationId', as: 'payment' });
Reservation.hasMany(Availability, { foreignKey: 'reservationId', as: 'availabilities' });
Reservation.hasMany(Message, { foreignKey: 'reservationId', as: 'messages' });
Reservation.hasMany(Review, { foreignKey: 'reservationId', as: 'reviews' });


Payment.belongsTo(Reservation, { foreignKey: 'reservationId', as: 'reservation' });
Payment.belongsTo(User, { foreignKey: 'payerId', as: 'payer' });


Message.belongsTo(Reservation, { foreignKey: 'reservationId', as: 'reservation' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });


Review.belongsTo(Reservation, { foreignKey: 'reservationId', as: 'reservation' });
Review.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
Review.belongsTo(User, { foreignKey: 'revieweeId', as: 'reviewee' });
Review.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });


Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });


PlatformConfig.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

const db = {
  sequelize,
  User,
  IdentityVerification,
  Property,
  PropertyPhoto,
  Availability,
  Reservation,
  Payment,
  Message,
  Review,
  Notification,
  PlatformConfig,
};

module.exports = db;