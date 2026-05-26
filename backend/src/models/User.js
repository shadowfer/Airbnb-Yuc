

const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Identificador único del usuario',
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre es obligatorio' },
      len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' },
    },
    comment: 'Nombre del usuario',
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El apellido es obligatorio' },
      len: { args: [2, 100], msg: 'El apellido debe tener entre 2 y 100 caracteres' },
    },
    comment: 'Apellido del usuario',
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: { msg: 'Este correo electrónico ya está registrado' },
    validate: {
      isEmail: { msg: 'Debe ingresar un correo electrónico válido' },
      notEmpty: { msg: 'El correo electrónico es obligatorio' },
    },
    comment: 'Correo electrónico único del usuario',
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La contraseña es obligatoria' },
      len: { args: [6, 255], msg: 'La contraseña debe tener al menos 6 caracteres' },
    },
    comment: 'Contraseña hasheada con bcrypt',
  },
  role: {
    type: DataTypes.ENUM('guest', 'host', 'admin'),
    allowNull: false,
    defaultValue: 'guest',
    validate: {
      isIn: {
        args: [['guest', 'host', 'admin']],
        msg: 'El rol debe ser "guest", "host" o "admin"',
      },
    },
    comment: 'Rol del usuario en la plataforma: huésped, anfitrión o administrador',
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
    validate: {
      is: { args: /^[+]?[\d\s()-]*$/, msg: 'Formato de teléfono inválido' },
    },
    comment: 'Número de teléfono (opcional)',
  },
  avatarUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL de la foto de perfil en Cloudinary',
  },
  stripeCustomerId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID del cliente en Stripe para pagos',
  },
  stripeAccountId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID de la cuenta de Stripe Connect para anfitriones',
  },
  identityStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Estado de la verificación de identidad',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si la cuenta está activa',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indica si el usuario verificó su correo electrónico',
  },
  emailVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha y hora de verificación de correo electrónico',
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    comment: 'Token temporal para recuperación de contraseña',
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    comment: 'Fecha de expiración del token de recuperación',
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de eliminación suave (soft delete)',
  },
}, {
  tableName: 'users',
  paranoid: true,
  hooks: {

    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },

    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});


User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


User.prototype.toSafeObject = function () {
  const { password, resetPasswordToken, resetPasswordExpires, ...safeUser } = this.toJSON();
  return safeUser;
};

module.exports = User;