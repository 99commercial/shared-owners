const User = require('../models/User');
const UserSession = require('../models/UserSession');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');
const { ROLE_VALUES } = require('../common/roles');

/**
 Authentication: verifies the Bearer access token and loads the user and session.
 Role / active status / session state are read from the DB, so deactivations,
 role changes, logouts and deletions take effect immediately rather than when
 the token expires.
 Sets req.user = { id, email, role, organisationId, sessionId, impersonatedBy }
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Authentication required');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  if (!payload.sid) {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  const [user, session] = await Promise.all([
    User.findById(payload.sub).select('email role organisationId isActive').lean(),
    UserSession.findById(payload.sid).select('user endedAt impersonatedBy').lean(),
  ]);

  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }
  if (!session || session.endedAt || String(session.user) !== String(user._id)) {
    throw new ApiError(401, 'Session has ended, please log in again');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated');
  }

  req.user = {
    id: String(user._id),
    email: user.email,
    role: user.role,
    organisationId: user.organisationId ? String(user.organisationId) : null,
    sessionId: String(session._id),
    impersonatedBy: session.impersonatedBy ? String(session.impersonatedBy) : null,
  };

  next();
});

/**
 Authorization: allows only the given roles. Must run after `authenticate`.
 
 Usage:
 router.get('/x', authenticate, authorize(ROLES.ADMIN), handler)
 router.get('/y', authenticate, authorize(ORG_MEMBER_ROLES, ROLES.ORGANISATION), handler)
 */
const authorize = (...roles) => {
  const allowed = roles.flat();

  const unknown = allowed.filter((role) => !ROLE_VALUES.includes(role));
  if (!allowed.length || unknown.length) {
    throw new Error(
      `authorize() needs valid roles. Unknown: ${unknown.join(', ') || '(none given)'}`
    );
  }

  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!allowed.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    return next();
  };
};

module.exports = { authenticate, authorize };
