const { Availability } = require('../models');
const { Op } = require('sequelize');

/**
 * Checks if a property is available for a given date range.
 * @param {number} propertyId 
 * @param {string} checkIn - Date in format YYYY-MM-DD
 * @param {string} checkOut - Date in format YYYY-MM-DD
 * @returns {Promise<boolean>} True if available, false if not
 */
const checkAvailability = async (propertyId, checkIn, checkOut) => {
  if (!checkIn || !checkOut) return true;

  const count = await Availability.count({
    where: {
      propertyId,
      blockedDate: {
        [Op.gte]: checkIn,
        [Op.lt]: checkOut,
      },
    },
  });
  return count === 0;
};

module.exports = {
  checkAvailability,
};
