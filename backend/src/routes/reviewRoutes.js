const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const { getPropertyReviews, createReview } = require('../controllers/reviewController');

router.get('/', getPropertyReviews);
router.post('/', authMiddleware, createReview);

module.exports = router;
