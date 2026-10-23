const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Generate a secure random token (hex string)
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Hash a token or OTP for storage (fast, deterministic — for URL tokens)
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Generate OTP and bcrypt-hash it (for OTPs where brute-force resistance matters)
const createOtp = async () => {
  const otp = generateOtp();
  const hash = await bcrypt.hash(otp, 10);
  return { otp, hash };
};

// Verify an OTP against its bcrypt hash
const verifyOtp = (otp, hash) => bcrypt.compare(otp, hash);

module.exports = { generateToken, generateOtp, hashToken, createOtp, verifyOtp };
