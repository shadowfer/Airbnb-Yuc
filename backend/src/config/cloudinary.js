const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'test_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'test_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'test_secret',
});

module.exports = cloudinary;
