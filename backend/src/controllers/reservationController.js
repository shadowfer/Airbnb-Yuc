const { Reservation, Property, PropertyPhoto, User, Availability, sequelize } = require('../models');
const { checkAvailability } = require('../services/availabilityService');
const { Op } = require('sequelize');

// POST /api/reservations
const createReservation = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { propertyId, checkIn, checkOut, guestsCount } = req.body;

    if (!propertyId || !checkIn || !checkOut) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser completados (propertyId, checkIn, checkOut).',
      });
    }

    // Validate dates
    const inDate = new Date(checkIn + 'T12:00:00');
    const outDate = new Date(checkOut + 'T12:00:00');
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime()) || outDate <= inDate) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Rango de fechas inválido. La fecha de check-out debe ser posterior al check-in.',
      });
    }

    // Fetch property
    const property = await Property.findByPk(propertyId, { transaction });
    if (!property || property.status === 'deleted') {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada.',
      });
    }

    // Host cannot reserve their own property
    if (property.hostId === req.user.id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No puedes reservar tu propia propiedad.',
      });
    }

    // Check max guests limit
    const numGuests = parseInt(guestsCount, 10) || 1;
    if (numGuests > property.maxGuests) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `El número de huéspedes (${numGuests}) excede la capacidad máxima de la propiedad (${property.maxGuests}).`,
      });
    }

    // Check availability
    const isAvailable = await checkAvailability(propertyId, checkIn, checkOut);
    if (!isAvailable) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Las fechas seleccionadas ya no están disponibles. Elige otras fechas.',
      });
    }

    // Calculate nights & pricing
    const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
    const pricePerNight = parseFloat(property.pricePerNight);
    const subtotal = parseFloat((nights * pricePerNight).toFixed(2));
    const serviceFee = parseFloat((subtotal * 0.12).toFixed(2));
    const totalPrice = parseFloat((subtotal + serviceFee).toFixed(2));

    // Create reservation
    const reservation = await Reservation.create(
      {
        guestId: req.user.id,
        propertyId,
        checkIn,
        checkOut,
        guestsCount: numGuests,
        pricePerNight,
        subtotal,
        serviceFee,
        totalPrice,
        status: 'confirmed',
      },
      { transaction }
    );

    // Generate array of dates to block (excluding checkout day)
    const datesToBlock = [];
    let current = new Date(inDate);
    const last = new Date(outDate);
    while (current < last) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      datesToBlock.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }

    // Create availability records for blocked dates
    if (datesToBlock.length > 0) {
      await Availability.bulkCreate(
        datesToBlock.map((blockedDate) => ({
          propertyId,
          blockedDate,
          reason: 'reservation',
          reservationId: reservation.id,
        })),
        { transaction, ignoreDuplicates: true }
      );
    }

    await transaction.commit();

    // Fetch full reservation info with property and host
    const fullReservation = await Reservation.findByPk(reservation.id, {
      include: [
        {
          model: Property,
          as: 'property',
          include: [
            {
              model: PropertyPhoto,
              as: 'photos',
              where: { orderIndex: 0 },
              required: false,
              limit: 1,
            },
            {
              model: User,
              as: 'host',
              attributes: ['id', 'firstName', 'lastName', 'email', 'avatarUrl'],
            },
          ],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: '¡Reservación realizada con éxito!',
      reservation: fullReservation,
      data: { reservation: fullReservation },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

// GET /api/reservations/my (Guest view)
const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.findAll({
      where: { guestId: req.user.id },
      include: [
        {
          model: Property,
          as: 'property',
          include: [
            {
              model: PropertyPhoto,
              as: 'photos',
              attributes: ['id', 'url', 'orderIndex'],
            },
            {
              model: User,
              as: 'host',
              attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'email', 'phone'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      reservations,
      data: { reservations },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reservations/host (Host view)
const getHostReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.findAll({
      include: [
        {
          model: Property,
          as: 'property',
          where: { hostId: req.user.id },
          include: [
            {
              model: PropertyPhoto,
              as: 'photos',
              where: { orderIndex: 0 },
              required: false,
              limit: 1,
            },
          ],
        },
        {
          model: User,
          as: 'guest',
          attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'email', 'phone'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      success: true,
      reservations,
      data: { reservations },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reservations/:id
const getReservationDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByPk(id, {
      include: [
        {
          model: Property,
          as: 'property',
          include: [
            {
              model: PropertyPhoto,
              as: 'photos',
            },
            {
              model: User,
              as: 'host',
              attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'email', 'phone'],
            },
          ],
        },
        {
          model: User,
          as: 'guest',
          attributes: ['id', 'firstName', 'lastName', 'avatarUrl', 'email', 'phone'],
        },
      ],
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservación no encontrada.',
      });
    }

    // Verify access rights (must be guest or host)
    if (reservation.guestId !== req.user.id && reservation.property.hostId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta reservación.',
      });
    }

    res.status(200).json({
      success: true,
      reservation,
      data: { reservation },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/reservations/:id/cancel
const cancelReservation = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const reservation = await Reservation.findByPk(id, {
      include: [{ model: Property, as: 'property' }],
      transaction,
    });

    if (!reservation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Reservación no encontrada.',
      });
    }

    // Check ownership
    const isGuest = reservation.guestId === req.user.id;
    const isHost = reservation.property.hostId === req.user.id;
    if (!isGuest && !isHost) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para cancelar esta reservación.',
      });
    }

    if (reservation.status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta reservación ya ha sido cancelada previamente.',
      });
    }

    // Update status
    await reservation.update(
      {
        status: 'cancelled',
        cancelledBy: req.user.id,
        cancellationReason: reason || (isGuest ? 'Cancelada por el huésped' : 'Cancelada por el anfitrión'),
      },
      { transaction }
    );

    // Free up blocked availability dates
    await Availability.destroy({
      where: { reservationId: reservation.id },
      transaction,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Reservación cancelada exitosamente.',
      reservation,
      data: { reservation },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    next(error);
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  getHostReservations,
  getReservationDetail,
  cancelReservation,
};
