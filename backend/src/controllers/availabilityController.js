const { Availability, Property, Reservation } = require('../models');
const { checkAvailability } = require('../services/availabilityService');
const { Op } = require('sequelize');

// GET /api/availability/:propertyId
const getAvailability = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findByPk(propertyId);
    if (!property || property.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada.',
      });
    }

    const blockedDates = await Availability.findAll({
      where: { propertyId },
      include: [
        {
          model: Reservation,
          as: 'reservation',
          attributes: ['id', 'checkIn', 'checkOut'],
          required: false,
        },
      ],
      order: [['blocked_date', 'ASC']],
    });

    res.status(200).json({
      success: true,
      blockedDates,
      data: { blockedDates },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/availability
const blockDates = async (req, res, next) => {
  try {
    const propertyId = req.body.propertyId || req.body.property_id;
    const { dates, reason = 'host_block' } = req.body;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el ID de la propiedad.',
      });
    }

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un array de fechas no vacío.',
      });
    }

    // Verify ownership
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

    // Query which dates already exist before we do bulkCreate
    const preExisting = await Availability.findAll({
      where: {
        propertyId,
        blockedDate: {
          [Op.in]: dates,
        },
      },
      attributes: ['blockedDate'],
    });

    const preExistingDates = preExisting.map((r) => r.blockedDate);
    const datesToCreate = dates.filter((d) => !preExistingDates.includes(d));

    let createdCount = 0;
    if (datesToCreate.length > 0) {
      const createdRecords = await Availability.bulkCreate(
        datesToCreate.map((d) => ({
          propertyId,
          blockedDate: d,
          reason,
        })),
        {
          ignoreDuplicates: true,
        }
      );
      createdCount = createdRecords.length;
    }

    const skippedCount = dates.length - createdCount;

    res.status(201).json({
      success: true,
      created: createdCount,
      skipped: skippedCount,
      data: {
        created: createdCount,
        skipped: skippedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/availability/:id
const unblockDate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const availabilityRecord = await Availability.findByPk(id);
    if (!availabilityRecord) {
      return res.status(404).json({
        success: false,
        message: 'Registro de disponibilidad no encontrado.',
      });
    }

    // Verify ownership of the property this record belongs to
    const property = await Property.findByPk(availabilityRecord.propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Propiedad asociada no encontrada.',
      });
    }

    if (property.hostId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar la disponibilidad de esta propiedad.',
      });
    }

    // If reason is reservation, block deletion
    if (availabilityRecord.reason === 'reservation') {
      return res.status(403).json({
        success: false,
        message: 'No puedes desbloquear una fecha con reserva confirmada.',
      });
    }

    await availabilityRecord.destroy();

    res.status(200).json({
      success: true,
      message: 'Fecha desbloqueada',
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/availability/:propertyId/check
const checkAvailabilityRange = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const { checkIn, checkOut } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar checkIn y checkOut en la consulta.',
      });
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
      return res.status(400).json({
        success: false,
        message: 'Las fechas deben estar en formato YYYY-MM-DD.',
      });
    }

    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);

    if (outDate <= inDate) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de checkOut debe ser posterior a checkIn.',
      });
    }

    const property = await Property.findByPk(propertyId);
    if (!property || property.status === 'deleted') {
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada.',
      });
    }

    const isAvailable = await checkAvailability(propertyId, checkIn, checkOut);

    // Get conflict dates if not available
    let conflictDates = [];
    if (!isAvailable) {
      const conflicts = await Availability.findAll({
        where: {
          propertyId,
          blockedDate: {
            [Op.gte]: checkIn,
            [Op.lt]: checkOut,
          },
        },
        attributes: ['blockedDate'],
      });
      conflictDates = conflicts.map((c) => c.blockedDate);
    }

    res.status(200).json({
      success: true,
      available: isAvailable,
      conflictDates,
      data: {
        available: isAvailable,
        conflictDates,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailability,
  blockDates,
  unblockDate,
  checkAvailabilityRange,
};
