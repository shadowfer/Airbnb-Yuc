const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const {
  createReservation,
  getMyReservations,
  getHostReservations,
  getReservationDetail,
  cancelReservation,
} = require('../controllers/reservationController');

// All reservation endpoints require authentication
router.post('/', authMiddleware, createReservation);
router.get('/my', authMiddleware, getMyReservations);
router.get('/host', authMiddleware, roleMiddleware(['host']), getHostReservations);
router.get('/:id', authMiddleware, getReservationDetail);
router.patch('/:id/cancel', authMiddleware, cancelReservation);

module.exports = router;
