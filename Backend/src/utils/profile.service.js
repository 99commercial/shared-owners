const User = require('../models/User');
const ApiError = require('./ApiError');
const { uploadImage, deleteImage, cloudinaryFolder } = require('./cloudinary');
const { PROFILE_KEY_BY_ROLE } = require('../common/roles');
const { isPlainObject, pick } = require('./validators');

/** Fields an account may set on its own profile, per profile type */
const EDITABLE_PROFILE_FIELDS = Object.freeze({
  userProfile: ['firstName', 'lastName', 'phone', 'avatarUrl'],
  organisationProfile: [
    'name',
    'type',
    'description',
    'contactEmail',
    'phone',
    'website',
    'address',
    'logoUrl',
  ],
  organisationAdminProfile: ['firstName', 'lastName', 'phone', 'jobTitle', 'avatarUrl'],
  organisationUserProfile: ['firstName', 'lastName', 'phone', 'jobTitle', 'avatarUrl'],
  adminProfile: ['firstName', 'lastName', 'phone', 'avatarUrl'],
});

/** Enough of any account to show who it is (for populated owner / creator fields) */
const ACCOUNT_SUMMARY_FIELDS = [
  'email',
  'role',
  'organisationId',
  'userProfile.firstName',
  'userProfile.lastName',
  'organisationProfile.name',
  'organisationProfile.slug',
  'organisationAdminProfile.firstName',
  'organisationAdminProfile.lastName',
  'organisationUserProfile.firstName',
  'organisationUserProfile.lastName',
].join(' ');

const pickProfileFields = (role, profile) =>
  pick(profile, EDITABLE_PROFILE_FIELDS[PROFILE_KEY_BY_ROLE[role]]);

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

const updateProfile = async (userId, updates = {}) => {
  if (!isPlainObject(updates)) {
    throw new ApiError(400, 'Request body must be an object');
  }

  const user = await getProfile(userId);

  const profileKey = PROFILE_KEY_BY_ROLE[user.role];
  const allowed = pick(updates, EDITABLE_PROFILE_FIELDS[profileKey]);

  if (!Object.keys(allowed).length) {
    throw new ApiError(
      400,
      `No editable fields provided. Allowed: ${EDITABLE_PROFILE_FIELDS[profileKey].join(', ')}`
    );
  }

  const current = user[profileKey] ? user[profileKey].toObject() : {};

  if (allowed.address !== undefined) {
    if (!isPlainObject(allowed.address)) {
      throw new ApiError(400, 'address must be an object');
    }
    allowed.address = { ...(current.address || {}), ...allowed.address };
  }

  user[profileKey] = { ...current, ...allowed };
  await user.save();

  return user;
};

/** Organisations have a logo; every other profile type has an avatar */
const photoFieldFor = (profileKey) => (profileKey === 'organisationProfile' ? 'logoUrl' : 'avatarUrl');

const AVATAR_SUBFOLDER = 'avatars';
const AVATAR_TRANSFORMATION = [
  { width: 400, height: 400, crop: 'fill', gravity: 'face' },
  { quality: 'auto', fetch_format: 'auto' },
];
/** Logos keep their aspect ratio; cropping would cut off wordmarks */
const LOGO_TRANSFORMATION = [
  { width: 600, height: 600, crop: 'limit' },
  { quality: 'auto', fetch_format: 'auto' },
];

/** Uploads to Cloudinary (one file per account, overwritten on re-upload) and saves the URL */
const uploadProfilePhoto = async (userId, buffer) => {
  const user = await getProfile(userId);
  const profileKey = PROFILE_KEY_BY_ROLE[user.role];

  const result = await uploadImage(buffer, {
    subfolder: AVATAR_SUBFOLDER,
    publicId: user._id.toString(),
    transformation: profileKey === 'organisationProfile' ? LOGO_TRANSFORMATION : AVATAR_TRANSFORMATION,
  });

  const current = user[profileKey] ? user[profileKey].toObject() : {};
  user[profileKey] = { ...current, [photoFieldFor(profileKey)]: result.secure_url };
  await user.save();
  return user;
};

const removeProfilePhoto = async (userId) => {
  const user = await getProfile(userId);
  const profileKey = PROFILE_KEY_BY_ROLE[user.role];
  const field = photoFieldFor(profileKey);
  const current = user[profileKey] ? user[profileKey].toObject() : {};

  if (current[field]?.includes('res.cloudinary.com')) {
    await deleteImage(`${cloudinaryFolder}/${AVATAR_SUBFOLDER}/${user._id}`);
  }
  delete current[field];
  user[profileKey] = current;
  await user.save();
  return user;
};

module.exports = {
  EDITABLE_PROFILE_FIELDS,
  ACCOUNT_SUMMARY_FIELDS,
  pickProfileFields,
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  removeProfilePhoto,
};
