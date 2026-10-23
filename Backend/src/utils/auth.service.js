const mongoose = require('mongoose');
const User = require('../models/User');
const ApiError = require('./ApiError');
const { sendMailSafely } = require('./email.service');
const { emailVerificationEmail } = require('../emails/emailVerification');
const { forgotPasswordEmail } = require('../emails/forgotPassword');
const { passwordChangeOtpEmail } = require('../emails/passwordChangeOtp');
const { generateToken, hashToken, createOtp, verifyOtp } = require('./token.service');
const { ROLES } = require('../common/roles');

const TOKEN_EXPIRY_24H = 24 * 60 * 60 * 1000;
const TOKEN_EXPIRY_1H = 60 * 60 * 1000;
const OTP_EXPIRY_10MIN = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

/**
 * Roles whose `isVerified` flag means "email confirmed". Organisation users are
 * verified by their organisation's approval instead, so they never get a link.
 */
const EMAIL_VERIFICATION_ROLES = Object.freeze([ROLES.USER, ROLES.ORGANISATION]);

/**
 * Derives a human-friendly display name from any user role's profile.
 * Falls back to 'there' when nothing is available.
 */
const getDisplayName = (user) => {
  const p =
    user.userProfile ||
    user.organisationAdminProfile ||
    user.organisationUserProfile ||
    user.adminProfile;
  if (p && p.firstName) return p.firstName;
  if (user.organisationProfile && user.organisationProfile.name) return user.organisationProfile.name;
  return 'there';
};

/**
 * Send an email verification link. Each call replaces the previous link.
 * Calls within a minute of the last link are ignored to stop inbox flooding.
 */
const sendVerificationEmail = async (user, frontendBaseUrl) => {
  if (!EMAIL_VERIFICATION_ROLES.includes(user.role) || user.isVerified) return null;

  const lastIssuedAt = user.emailVerificationTokenExpiry
    ? user.emailVerificationTokenExpiry.getTime() - TOKEN_EXPIRY_24H
    : 0;
  if (Date.now() - lastIssuedAt < RESEND_COOLDOWN_MS) return null;

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiry = new Date(Date.now() + TOKEN_EXPIRY_24H);

  await User.updateOne(
    { _id: user._id },
    { emailVerificationToken: tokenHash, emailVerificationTokenExpiry: expiry }
  );

  const verificationUrl = `${frontendBaseUrl}/verify-email/${token}?userId=${user._id}`;
  const firstName = getDisplayName(user);
  const emailContent = emailVerificationEmail({ firstName, verificationUrl });

  await sendMailSafely({ to: user.email, ...emailContent });
  return token;
};

/** Verify email using the token from the link */
const verifyEmail = async (userId, token) => {
  if (!token || !mongoose.isValidObjectId(userId)) throw new ApiError(400, 'Invalid verification link');

  const tokenHash = hashToken(token);
  const user = await User.findOne({
    _id: userId,
    role: { $in: EMAIL_VERIFICATION_ROLES },
    emailVerificationToken: tokenHash,
    emailVerificationTokenExpiry: { $gt: new Date() },
  }).select('+emailVerificationToken');

  if (!user) {
    // Opening the link a second time (or after an email scanner prefetched it) is not an error
    if (await User.exists({ _id: userId, isVerified: true })) {
      return { message: 'Email already verified. You can sign in now.' };
    }
    throw new ApiError(400, 'Verification link is invalid or has expired');
  }
  if (user.isVerified) return { message: 'Email already verified' };

  await User.updateOne(
    { _id: user._id },
    {
      $set: { isVerified: true },
      $unset: { emailVerificationToken: 1, emailVerificationTokenExpiry: 1 },
    }
  );

  return { message: 'Email verified successfully' };
};

/**
 * Send a password reset link.
 * Always returns a generic success message to prevent email enumeration.
 */
const sendPasswordResetEmail = async (email, allowedRoles, frontendBaseUrl) => {
  const user = await User.findOne({ email: email?.toLowerCase?.()?.trim() });

  if (!user || !allowedRoles.includes(user.role)) {
    return { message: 'If that email is registered, a reset link has been sent' };
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiry = new Date(Date.now() + TOKEN_EXPIRY_1H);

  await User.updateOne(
    { _id: user._id },
    { passwordResetToken: tokenHash, passwordResetTokenExpiry: expiry }
  );

  const resetUrl = `${frontendBaseUrl}/reset-password/${token}?userId=${user._id}`;
  const firstName = getDisplayName(user);
  const emailContent = forgotPasswordEmail({ firstName, resetUrl });

  await sendMailSafely({ to: user.email, ...emailContent });
  return { message: 'If that email is registered, a reset link has been sent' };
};

/** Reset password using the token from the reset link */
const resetPassword = async (userId, token, newPassword) => {
  if (!userId || !token) throw new ApiError(400, 'Invalid reset link');

  const { isValidPassword, MIN_PASSWORD_LENGTH } = require('./validators');
  if (!isValidPassword(newPassword)) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const tokenHash = hashToken(token);
  const user = await User.findOne({
    _id: userId,
    passwordResetToken: tokenHash,
    passwordResetTokenExpiry: { $gt: new Date() },
  }).select('+passwordResetToken +passwordHash');

  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired');

  const { hashPassword } = require('./session.service');
  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiry = undefined;
  await user.save();

  // End all sessions so other devices are signed out
  const UserSession = require('../models/UserSession');
  const { SESSION_END_REASONS } = require('../common/sessionOptions');
  await UserSession.updateMany(
    { user: user._id, endedAt: null },
    { $set: { endedAt: new Date(), endReason: SESSION_END_REASONS.PASSWORD_CHANGED } }
  );

  return { message: 'Password reset successfully. Please log in with your new password.' };
};

/** Send OTP to an authenticated user's email for a password change */
const sendPasswordChangeOtp = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const { otp, hash } = await createOtp();
  const expiry = new Date(Date.now() + OTP_EXPIRY_10MIN);

  await User.updateOne(
    { _id: userId },
    { passwordChangeOtp: hash, passwordChangeOtpExpiry: expiry }
  );

  const firstName = getDisplayName(user);
  const emailContent = passwordChangeOtpEmail({ firstName, otp });
  await sendMailSafely({ to: user.email, ...emailContent });

  return { message: 'OTP sent to your email address' };
};

/** Verify OTP and change password for an authenticated user */
const changePasswordWithOtp = async (userId, sessionId, { otp, newPassword } = {}) => {
  const { isValidPassword, MIN_PASSWORD_LENGTH } = require('./validators');
  if (!otp) throw new ApiError(400, 'OTP is required');
  if (!isValidPassword(newPassword)) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const user = await User.findOne({
    _id: userId,
    passwordChangeOtpExpiry: { $gt: new Date() },
  }).select('+passwordChangeOtp +passwordHash');

  if (!user || !user.passwordChangeOtp) {
    throw new ApiError(400, 'OTP is invalid or has expired. Please request a new one.');
  }

  const isValid = await verifyOtp(otp, user.passwordChangeOtp);
  if (!isValid) throw new ApiError(400, 'Incorrect OTP');

  const { hashPassword } = require('./session.service');
  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangeOtp = undefined;
  user.passwordChangeOtpExpiry = undefined;
  await user.save();

  // End all other sessions so other devices are signed out
  const UserSession = require('../models/UserSession');
  const { SESSION_END_REASONS } = require('../common/sessionOptions');
  await UserSession.updateMany(
    { user: user._id, endedAt: null, _id: { $ne: sessionId } },
    { $set: { endedAt: new Date(), endReason: SESSION_END_REASONS.PASSWORD_CHANGED } }
  );

  return { message: 'Password changed successfully. Other devices have been signed out.' };
};

module.exports = {
  EMAIL_VERIFICATION_ROLES,
  sendVerificationEmail,
  verifyEmail,
  sendPasswordResetEmail,
  resetPassword,
  sendPasswordChangeOtp,
  changePasswordWithOtp,
};
