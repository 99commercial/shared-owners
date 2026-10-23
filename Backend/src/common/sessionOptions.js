const SESSION_END_REASONS = Object.freeze({
  LOGOUT: 'logout',
  EVICTED: 'evicted',
  ACCOUNT_DELETED: 'account_deleted',
  PASSWORD_CHANGED: 'password_changed',
  DEACTIVATED: 'deactivated',
});

/** Max concurrent login sessions (devices) per user; the oldest is ended */
const MAX_SESSIONS_PER_USER = 5;

/** Activity logs older than this are removed by a MongoDB TTL index */
const ACTIVITY_LOG_RETENTION_DAYS = 180;

module.exports = {
  SESSION_END_REASONS,
  SESSION_END_REASON_VALUES: Object.freeze(Object.values(SESSION_END_REASONS)),
  MAX_SESSIONS_PER_USER,
  ACTIVITY_LOG_RETENTION_DAYS,
};
