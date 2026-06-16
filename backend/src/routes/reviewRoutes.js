const express = require('express');
const router = express.Router();

const { getPropertyReviews } = require('../controllers/reviewController');

router.get('/', getPropertyReviews);

module.exports = router;
