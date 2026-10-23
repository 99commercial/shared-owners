const { v2: cloudinary } = require('cloudinary');
const config = require('../config');
const ApiError = require('./ApiError');

const { cloudName, apiKey, apiSecret, folder } = config.cloudinary;
const isConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

/**
 * Uploads an in-memory image buffer. `publicId` is fixed per owner (e.g. avatars/<userId>)
 * so a new upload overwrites the old file instead of leaving orphans.
 */
const uploadImage = (buffer, { subfolder, publicId, transformation } = {}) => {
  if (!isConfigured) {
    return Promise.reject(new ApiError(503, 'Image uploads are not configured on the server'));
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${folder}/${subfolder}`,
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        resource_type: 'image',
        transformation,
      },
      (err, result) => (err ? reject(new ApiError(502, `Image upload failed: ${err.message}`)) : resolve(result))
    );
    stream.end(buffer);
  });
};

const deleteImage = async (publicId) => {
  if (!isConfigured) return;
  await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: 'image' });
};

module.exports = { uploadImage, deleteImage, cloudinaryFolder: folder };
