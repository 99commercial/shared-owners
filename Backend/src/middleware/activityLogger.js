const ActivityLog = require('../models/ActivityLog');
const UserSession = require('../models/UserSession');

/**
 Records every authenticated API call against the caller's login session,
 once the response has been sent. Mount before the routers; requests that
 never pass `authenticate` (login, register, public pages) are skipped.
 */
const activityLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    if (!req.user?.sessionId) return;

    const now = new Date();
    const { user } = req;

    ActivityLog.create({
      user: user.id,
      session: user.sessionId,
      role: user.role,
      organisationId: user.organisationId,
      impersonatedBy: user.impersonatedBy,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      route: req.route ? `${req.baseUrl}${req.route.path}` : undefined,
      query: Object.keys(req.query || {}).length ? req.query : undefined,
      statusCode: res.statusCode,
      durationMs: Math.round(Number(process.hrtime.bigint() - startedAt) / 1e4) / 100,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => console.error('Failed to write activity log:', err.message));

    UserSession.updateOne({ _id: user.sessionId }, { $set: { lastActivityAt: now } }).catch(
      (err) => console.error('Failed to update session activity:', err.message)
    );
  });

  next();
};

module.exports = activityLogger;
