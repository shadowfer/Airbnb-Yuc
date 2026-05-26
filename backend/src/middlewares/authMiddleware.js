

const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');


const authMiddleware = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. No se proporcionó token de autenticación.',
      });
    }

    const token = authHeader.split(' ')[1];


    const decoded = verifyToken(token);


    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'El usuario asociado a este token ya no existe.',
      });
    }


    req.user = user;
    next();
  } catch (error) {

    return res.status(401).json({
      success: false,
      message: 'Token inválido',
    });
  }
};

module.exports = authMiddleware;