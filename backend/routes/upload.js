const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'kodo-wiki',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/image', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.json({ url: req.file.path, filename: req.file.filename });
});

module.exports = router;