const Property = require('../models/Property');

const ownershipMiddleware = async (req, res, next) => {
  try {
    const propertyId = req.params.id || req.body.propertyId;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'ID de propiedad no especificado.',
      });
    }

    const property = await Property.findByPk(propertyId);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada.',
      });
    }

    if (property.hostId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta propiedad.',
      });
    }

    req.property = property;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = ownershipMiddleware;
