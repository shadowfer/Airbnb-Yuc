const { Review, User } = require('../models');
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

    const reviews = await Review.findAll({
      where: {
        propertyId,
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

module.exports = {
  getPropertyReviews,
};
