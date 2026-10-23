const multer = require('multer');
const ApiError = require('../utils/ApiError');

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) =>
    IMAGE_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new ApiError(400, 'Only JPG, PNG or WEBP images are allowed')),
});

/** Single image in multipart field `field`, kept in memory as req.file.buffer */
const singleImage = (field) => (req, res, next) =>
  imageUpload.single(field)(req, res, (err) => {
    if (!err) {
      if (!req.file) return next(new ApiError(400, `Attach an image in the "${field}" field`));
      return next();
    }
    if (err instanceof multer.MulterError) {
      return next(new ApiError(400, err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller' : err.message));
    }
    return next(err);
  });

module.exports = { singleImage };
