const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const ownershipMiddleware = require('../middlewares/ownershipMiddleware');

const {
  createProperty,
  getMyProperties,
  getPropertyDetail,
  updateProperty,
  deleteProperty,
  searchProperties,
} = require('../controllers/propertyController');

const {
  uploadPhoto,
  deletePhoto,
  reorderPhotos,
} = require('../controllers/photoController');

const upload = require('../middlewares/uploadMiddleware');

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['host']),
  createProperty
);

router.get(
  '/my',
  authMiddleware,
  roleMiddleware(['host']),
  getMyProperties
);

router.get('/search', searchProperties);
router.get('/:id', getPropertyDetail);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['host']),
  ownershipMiddleware,
  updateProperty
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['host']),
  ownershipMiddleware,
  deleteProperty
);

// Photo routes
router.post(
  '/:id/photos',
  authMiddleware,
  roleMiddleware(['host']),
  ownershipMiddleware,
  upload.single('photo'),
  uploadPhoto
);

router.delete(
  '/:id/photos/:photoId',
  authMiddleware,
  roleMiddleware(['host']),
  ownershipMiddleware,
  deletePhoto
);

router.patch(
  '/:id/photos/reorder',
  authMiddleware,
  roleMiddleware(['host']),
  ownershipMiddleware,
  reorderPhotos
);

module.exports = router;
