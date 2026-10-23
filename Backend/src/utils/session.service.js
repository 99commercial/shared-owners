const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const ApiError = require('./ApiError');
const { parseUserAgent } = require('./userAgent');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('./jwt');
const {
  MIN_PASSWORD_LENGTH,
  isNonEmptyString,
  isValidEmail,
  isValidPassword,
  isCompanyEmail,
  normaliseEmail,
} = require('./validators');
const {
  SESSION_END_REASONS,
  MAX_SESSIONS_PER_USER,
} = require('../common/sessionOptions');
const { ROLES } = require('../common/roles');

const SALT_ROUNDS = 12;

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

const assertCompanyEmail = (email) => {
  if (!isValidEmail(email)) {
    throw new ApiError(400, 'A valid email is required');
  }
  if (!isCompanyEmail(email)) {
    throw new ApiError(
      400,
      'Please use your company email address. Personal email providers are not allowed'
    );
  }
};

/** Organisation admins / users cannot sign in once their organisation is deactivated */
const assertOrganisationActive = async (user) => {
  if (!user.organisationId) return;
  const organisationActive = await User.exists({ _id: user.organisationId, isActive: true });
  if (!organisationActive) {
    throw new ApiError(403, 'Your organisation account is deactivated');
  }
};

/**
 * Accounts sign in only once `isVerified` is set. For self-registered users and
 * organisations that means confirming their email; for organisation users it
 * means approval by their organisation. Call after the password check so the
 * response never reveals whether an email is registered.
 */
const assertVerified = (user) => {
  if (user.isVerified) return;
  if (user.role === ROLES.ORGANISATION_USER) {
    throw new ApiError(403, 'Your account is waiting for approval from your organisation');
  }
  throw new ApiError(403, 'Please verify your email address before logging in', {
    code: 'EMAIL_NOT_VERIFIED',
    email: user.email,
  });
};

/**
 * Checks email + password, then that the account may use this login.
 * The role check runs after the password check so it never reveals
 * which emails are registered.
 */
const verifyCredentials = async ({ email, password } = {}, allowedRoles, wrongRoleMessage) => {
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: normaliseEmail(email) }).select('+passwordHash');
  const passwordMatches = user && (await bcrypt.compare(password, user.passwordHash));
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!allowedRoles.includes(user.role)) {
    throw new ApiError(403, wrongRoleMessage);
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated');
  }

  return user;
};

/** Ends the oldest of the user's own (non-impersonated) sessions beyond the limit */
const evictOldSessions = async (userId) => {
  const stale = await UserSession.find({ user: userId, endedAt: null, impersonatedBy: null })
    .sort({ createdAt: -1 })
    .skip(MAX_SESSIONS_PER_USER)
    .select('_id')
    .lean();

  if (stale.length) {
    await UserSession.updateMany(
      { _id: { $in: stale.map((s) => s._id) } },
      { $set: { endedAt: new Date(), endReason: SESSION_END_REASONS.EVICTED } }
    );
  }
};

/**
 * Creates a login session and returns its token pair. The account's own logins
 * also update `lastLogin` (IP, device, time); impersonated sessions do not.
 */
const startSession = async (user, { ip, userAgent, impersonatedBy = null } = {}) => {
  const { token: refreshToken, expiresAt } = signRefreshToken(user);
  const device = parseUserAgent(userAgent);

  const session = await UserSession.create({
    user: user._id,
    role: user.role,
    organisationId: user.organisationId || null,
    impersonatedBy,
    ip,
    userAgent,
    device,
    refreshTokenHash: hashToken(refreshToken),
    refreshTokenExpiresAt: expiresAt,
  });

  if (!impersonatedBy) {
    const lastLogin = { ip, userAgent, device, at: session.createdAt };
    await User.updateOne({ _id: user._id }, { $set: { lastLogin } });
    if (typeof user.set === 'function') user.set('lastLogin', lastLogin);
    await evictOldSessions(user._id);
  }

  return {
    accessToken: signAccessToken(user, session),
    refreshToken,
  };
};

/**
 * Rotates the refresh token. The presented token is swapped atomically,
 * so it cannot be used twice.
 */
const refreshSession = async (refreshToken, allowedRoles) => {
  if (!isNonEmptyString(refreshToken)) {
    throw new ApiError(400, 'refreshToken is required');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user || !allowedRoles.includes(user.role)) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated');
  }

  const { token: nextRefreshToken, expiresAt } = signRefreshToken(user);
  const now = new Date();

  const session = await UserSession.findOneAndUpdate(
    {
      user: user._id,
      refreshTokenHash: hashToken(refreshToken),
      endedAt: null,
      refreshTokenExpiresAt: { $gt: now },
    },
    {
      $set: {
        refreshTokenHash: hashToken(nextRefreshToken),
        refreshTokenExpiresAt: expiresAt,
        lastActivityAt: now,
      },
    },
    { new: true }
  );

  if (!session) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  return {
    accessToken: signAccessToken(user, session),
    refreshToken: nextRefreshToken,
  };
};

const endSession = (sessionId, reason = SESSION_END_REASONS.LOGOUT) =>
  UserSession.updateOne(
    { _id: sessionId, endedAt: null },
    { $set: { endedAt: new Date(), endReason: reason } }
  );

const endAllSessions = (userId, reason) =>
  UserSession.updateMany(
    { user: userId, endedAt: null },
    { $set: { endedAt: new Date(), endReason: reason } }
  );

/** Starts a session as `account` on someone else's behalf, recorded as `impersonatedBy` */
const impersonateAccount = async (account, client, impersonatedBy) => {
  if (!account.isActive) {
    throw new ApiError(403, 'Account is deactivated');
  }
  const tokens = await startSession(account, { ...client, impersonatedBy });
  return { user: account, impersonatedBy, ...tokens };
};

/**
 * Changes the account's own password and signs out every other device.
 * Not allowed from an impersonated session.
 */
const changePassword = async (requester, { currentPassword, newPassword } = {}) => {
  if (requester.impersonatedBy) {
    throw new ApiError(403, 'The password cannot be changed while impersonating this account');
  }
  if (!isNonEmptyString(currentPassword) || newPassword === undefined) {
    throw new ApiError(400, 'currentPassword and newPassword are required');
  }
  if (!isValidPassword(newPassword)) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const user = await User.findById(requester.id).select('+passwordHash');
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    throw new ApiError(400, 'New password must be different from the current password');
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  await UserSession.updateMany(
    { user: user._id, endedAt: null, _id: { $ne: requester.sessionId } },
    { $set: { endedAt: new Date(), endReason: SESSION_END_REASONS.PASSWORD_CHANGED } }
  );
};

module.exports = {
  hashPassword,
  assertCompanyEmail,
  assertOrganisationActive,
  assertVerified,
  verifyCredentials,
  startSession,
  refreshSession,
  endSession,
  endAllSessions,
  impersonateAccount,
  changePassword,
};
