/** IPv4 addresses arrive as "::ffff:1.2.3.4" on dual-stack servers */
const normaliseIp = (ip) => (typeof ip === 'string' ? ip.replace(/^::ffff:/, '') : ip);

/** Client details stored on a login session */
const getClientInfo = (req) => ({
  ip: normaliseIp(req.ip),
  userAgent: req.get('user-agent'),
});

module.exports = { getClientInfo, normaliseIp };
