

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const identityController = require('../controllers/identityController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const uploadIdentity = require('../middlewares/uploadIdentityMiddleware');



router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/reset-password/:token', authController.resetPassword);



router.get('/me', authMiddleware, authController.getMe);

router.post(
  '/verify-identity',
  authMiddleware,
  roleMiddleware(['host']),
  uploadIdentity.single('document'),
  identityController.verifyIdentity
);

router.get(
  '/identity-status',
  authMiddleware,
  identityController.getIdentityStatus
);

module.exports = router;