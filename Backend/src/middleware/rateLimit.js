const ApiError = require('../utils/ApiError');
const { normaliseIp } = require('../utils/requestInfo');

/**
 * In-memory limiter per client IP, for public forms. Counts reset after
 * `windowMs`; enough for one server instance.
 */
const rateLimit = ({ max, windowMs, message = 'Too many requests, please try again later' }) => {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    hits.forEach((entry, ip) => { if (entry.resetAt <= now) hits.delete(ip); });
  }, windowMs).unref();

  return (req, _res, next) => {
    const ip = normaliseIp(req.ip);
    const now = Date.now();
    const entry = hits.get(ip);
    if (!entry || entry.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    return entry.count > max ? next(new ApiError(429, message)) : next();
  };
};

module.exports = { rateLimit };
