const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

/** `sid` ties the token to a UserSession; `imp` is the organisation impersonating this user */
const signAccessToken = (user, session) =>
  jwt.sign(
    {
      role: user.role,
      organisationId: user.organisationId ? String(user.organisationId) : null,
      sid: String(session._id),
      ...(session.impersonatedBy && { imp: String(session.impersonatedBy) }),
    },
    config.jwt.accessSecret,
    { subject: String(user._id), expiresIn: config.jwt.accessExpiresIn }
  );

/** jwtid keeps tokens issued in the same second unique, so their hashes differ */
const signRefreshToken = (user) => {
  const token = jwt.sign({}, config.jwt.refreshSecret, {
    subject: String(user._id),
    expiresIn: config.jwt.refreshExpiresIn,
    jwtid: crypto.randomUUID(),
  });
  const { exp } = jwt.decode(token);
  return { token, expiresAt: new Date(exp * 1000) };
};

const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);

const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
};
