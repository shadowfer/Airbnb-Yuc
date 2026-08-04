const { Review, Reservation, Property, User } = require('../models');
const { Op } = require('sequelize');

// GET /api/reviews?propertyId=:id
const getPropertyReviews = async (req, res, next) => {
  try {
    const { propertyId } = req.query;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el query parameter propertyId.',
      });
    }

    const parsedPropertyId = parseInt(propertyId, 10) || propertyId;

    const reviews = await Review.findAll({
      where: {
        propertyId: parsedPropertyId,
        type: 'guest_to_property',
      },
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'avatarUrl'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    let totalReviews = reviews.length;
    let avgRating = null;

    if (totalReviews > 0) {
      const sum = reviews.reduce((acc, r) => acc + parseFloat(r.rating), 0);
      avgRating = parseFloat((sum / totalReviews).toFixed(1));
    }

    res.status(200).json({
      success: true,
      reviews,
      avgRating,
      totalReviews,
      data: {
        reviews,
        avgRating,
        totalReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/reviews
const createReview = async (req, res, next) => {
  try {
    const { reservationId, rating, comment } = req.body;

    if (!reservationId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios: reservationId, rating (1-5), comment.',
      });
    }

    const numericRating = parseInt(rating, 10);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe ser un entero entre 1 y 5.',
      });
    }

    // Fetch reservation
    const reservation = await Reservation.findByPk(reservationId, {
      include: [{ model: Property, as: 'property' }],
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservación no encontrada.',
      });
    }

    // Verify current user is the guest
    if (reservation.guestId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Solo el huésped que realizó la reservación puede dejar una reseña.',
      });
    }

    // Check if review already exists for this reservation
    const existingReview = await Review.findOne({
      where: {
        reservationId,
        reviewerId: req.user.id,
      },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Ya has publicado una reseña para esta reservación.',
      });
    }

    // Create review
    const review = await Review.create({
      reservationId,
      reviewerId: req.user.id,
      revieweeId: reservation.property.hostId,
      propertyId: reservation.propertyId,
      rating: numericRating,
      comment: comment.trim(),
      type: 'guest_to_property',
    });

    const fullReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'firstName', 'lastName', 'avatarUrl'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Reseña publicada exitosamente.',
      review: fullReview,
      data: { review: fullReview },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPropertyReviews,
  createReview,
};
