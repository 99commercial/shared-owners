/**
 * Creates the platform admin account. Admins cannot register through the API.
 *
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:admin
 *
 * Optional: ADMIN_FIRST_NAME, ADMIN_LAST_NAME. Running it again with an email
 * that already exists leaves that account unchanged.
 */
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const { ROLES } = require('../common/roles');
const {
  MIN_PASSWORD_LENGTH,
  isValidEmail,
  isValidPassword,
  normaliseEmail,
} = require('../utils/validators');
const { hashPassword } = require('../utils/session.service');

const seedAdmin = async () => {
  const {
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_FIRST_NAME = 'Platform',
    ADMIN_LAST_NAME = 'Admin',
  } = process.env;

  if (!isValidEmail(ADMIN_EMAIL)) {
    throw new Error('ADMIN_EMAIL must be a valid email');
  }
  if (!isValidPassword(ADMIN_PASSWORD)) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const email = normaliseEmail(ADMIN_EMAIL);
  const existing = await User.findOne({ email }).select('role').lean();
  if (existing) {
    if (existing.role !== ROLES.ADMIN) {
      throw new Error(`${email} already belongs to a ${existing.role} account`);
    }
    console.log(`Admin ${email} already exists, nothing to do`);
    return;
  }

  await User.create({
    email,
    passwordHash: await hashPassword(ADMIN_PASSWORD),
    role: ROLES.ADMIN,
    isVerified: true,
    adminProfile: { firstName: ADMIN_FIRST_NAME, lastName: ADMIN_LAST_NAME },
  });
  console.log(`Admin ${email} created`);
};

connectDB()
  .then(seedAdmin)
  .then(() => mongoose.disconnect())
  .catch(async (err) => {
    console.error('Admin seeding failed:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  });
