

const { Op } = require('sequelize');
const User = require('../models/User');
const { generateToken, generateResetToken } = require('../utils/tokenUtils');
const { sendPasswordResetEmail } = require('../services/emailService');


const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, phone } = req.body;


    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser completados.',
        requiredFields: ['firstName', 'lastName', 'email', 'password', 'role'],
      });
    }


    if (!['guest', 'host'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'El rol debe ser "guest" o "host".',
      });
    }


    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este correo electrónico ya está registrado.',
      });
    }


    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      phone: phone || null,
    });


    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      data: {
        user: user.toSafeObject(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};


const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'El correo y la contraseña son obligatorios.',
      });
    }


    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no existe.',
      });
    }


    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas.',
      });
    }


    const token = generateToken(user);


    const safeUser = user.toSafeObject();
    const userResponse = {
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      first_name: safeUser.firstName,
      firstName: safeUser.firstName,
      lastName: safeUser.lastName,
    };

    res.status(200).json({
      success: true,
      message: `¡Bienvenido/a, ${user.firstName}!`,
      token,
      user: userResponse,
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};


const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico es obligatorio.',
      });
    }


    const user = await User.findOne({ where: { email } });

    if (user) {

      const resetToken = generateResetToken();
      const resetExpires = new Date(Date.now() + 15 * 60 * 1000);


      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save({ hooks: false });


      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;


      await sendPasswordResetEmail(email, resetUrl);
    }


    res.status(200).json({
      success: true,
      message: 'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.',
    });
  } catch (error) {
    next(error);
  }
};


const resetPassword = async (req, res, next) => {
  try {
    const token = req.body.token || req.query.token || req.params.token;
    const password = req.body.newPassword || req.body.password;
    const confirmPassword = req.body.confirmPassword !== undefined ? req.body.confirmPassword : password;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'El token de recuperación es obligatorio.',
      });
    }


    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña es obligatoria.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres.',
      });
    }


    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'El enlace de recuperación es inválido o ha expirado.',
      });
    }


    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.',
    });
  } catch (error) {
    next(error);
  }
};


const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        user: req.user.toSafeObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe,
};