const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const {
  getAvailability,
  blockDates,
  unblockDate,
  checkAvailabilityRange,
} = require('../controllers/availabilityController');

// Public routes
router.get('/:propertyId', getAvailability);
router.get('/:propertyId/check', checkAvailabilityRange);

// Protected host routes
router.post('/', authMiddleware, roleMiddleware(['host']), blockDates);
router.delete('/:id', authMiddleware, roleMiddleware(['host']), unblockDate);

module.exports = router;
