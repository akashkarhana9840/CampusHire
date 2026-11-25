const multer = require('multer');

// Store file in memory buffer so we can inspect bytes and stream it cleanly into MongoDB GridFS
const storage = multer.memoryStorage();

// PDF filter and max 2MB size limit
const uploadResume = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for resume upload'), false);
    }
  },
});

/**
 * Validates actual binary contents: PDF magic bytes check (%PDF-)
 */
const validatePDFMagicBytes = (req, res, next) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({
      success: false,
      message: 'No resume file uploaded',
    });
  }

  // Check magic bytes: The first 4 bytes of a real PDF must be "%PDF" (0x25 0x50 0x44 0x46)
  const header = req.file.buffer.slice(0, 4).toString('ascii');
  if (header !== '%PDF') {
    return res.status(400).json({
      success: false,
      message: 'Invalid file format: Uploaded file is not a valid PDF document',
    });
  }

  next();
};

module.exports = {
  uploadResume,
  validatePDFMagicBytes,
};

