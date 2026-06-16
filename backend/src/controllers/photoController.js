const cloudinary = require('../config/cloudinary');
const PropertyPhoto = require('../models/PropertyPhoto');
const Property = require('../models/Property');

const uploadToCloudinary = (fileBuffer, propertyId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `airbnb/properties/${propertyId}`,
        transformation: [
          { quality: 'auto', fetch_format: 'auto', width: 1920, crop: 'limit' },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

const uploadPhoto = async (req, res, next) => {
  try {
    const propertyId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ninguna foto.',
      });
    }

    const currentPhotosCount = await PropertyPhoto.count({
      where: { propertyId },
    });

    if (currentPhotosCount >= 20) {
      return res.status(400).json({
        success: false,
        message: 'Has alcanzado el límite máximo de 20 fotos para esta propiedad.',
      });
    }

    let result;
    const isCloudinaryConfigured = process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_KEY !== 'tu_api_key' && 
      process.env.CLOUDINARY_API_KEY !== 'test_key';

    if (isCloudinaryConfigured) {
      result = await uploadToCloudinary(req.file.buffer, propertyId);
    } else {
      // Local fallback
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(__dirname, '../../uploads/properties', String(propertyId));
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const ext = path.extname(req.file.originalname) || '.jpg';
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      const serverUrl = `${req.protocol}://${req.get('host')}`;
      result = {
        secure_url: `${serverUrl}/uploads/properties/${propertyId}/${filename}`,
        public_id: `properties/${propertyId}/${filename}`,
      };
    }

    const photo = await PropertyPhoto.create({
      propertyId,
      url: result.secure_url,
      cloudinaryId: result.public_id,
      orderIndex: currentPhotosCount,
    });

    res.status(201).json({
      success: true,
      message: 'Foto subida exitosamente.',
      photo,
      data: { photo },
    });
  } catch (error) {
    next(error);
  }
};

const deletePhoto = async (req, res, next) => {
  try {
    const { photoId } = req.params;

    const photo = await PropertyPhoto.findOne({
      where: { id: photoId },
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Foto no encontrada.',
      });
    }

    try {
      if (photo.cloudinaryId && photo.cloudinaryId.startsWith('properties/')) {
        // Local file deletion
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../../uploads', photo.cloudinaryId);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else {
        await cloudinary.uploader.destroy(photo.cloudinaryId);
      }
    } catch (clError) {
      console.error('Error deleting photo:', clError);
    }

    await photo.destroy();

    res.status(200).json({
      success: true,
      message: 'Foto eliminada',
    });
  } catch (error) {
    next(error);
  }
};

const reorderPhotos = async (req, res, next) => {
  try {
    const { photos } = req.body;

    if (!photos || !Array.isArray(photos)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de fotos con sus nuevos orderIndex.',
      });
    }

    await Promise.all(
      photos.map((item) =>
        PropertyPhoto.update(
          { orderIndex: item.orderIndex },
          { where: { id: item.id } }
        )
      )
    );

    res.status(200).json({
      success: true,
      message: 'Orden actualizado',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadPhoto,
  deletePhoto,
  reorderPhotos,
};
