require('dotenv').config();

const REQUIRED_ENV = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

/** Express "trust proxy": number of proxy hops, true/false, or a comma-separated list of IPs */
const parseTrustProxy = (value) => {
  if (value === undefined || value === '' || value === 'false') return false;
  if (value === 'true') return true;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
};

const BUILTIN_ORIGINS = [
  'http://localhost:5001',
  'https://shared-owners.onrender.com',
  'https://shared-owners.vercel.app',
];

/** Env origins are added on top of the built-in list, so a single localhost value cannot drop production. */
const parseOrigins = (value) => {
  const fromEnv = (value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...new Set([...BUILTIN_ORIGINS, ...fromEnv])];
};

const corsOrigin = parseOrigins(process.env.CORS_ORIGIN);

const config = {
  port: process.env.PORT || 3000,
  corsOrigin,
  /** Base URL used for links in emails (verification, password reset) */
  frontendUrl: process.env.FRONTEND_URL || (process.env.CORS_ORIGIN || '').split(',')[0].trim() || 'http://localhost:5001',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shared_ownership',
  nodeEnv: process.env.NODE_ENV || 'development',
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  /** Without SMTP_HOST, emails are printed to the console instead of being sent */
  mail: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || process.env.MAIL_FROM || 'SharedOwnership <no-reply@sharedownership.local>',
    /** Check the SMTP login when the server starts (logs the result, never blocks startup) */
    verifyOnStartup: process.env.SMTP_VERIFY_ON_STARTUP === 'true',
  },
  /** Email the unread recipient if a chat message is still unread after this long */
  chat: {
    unreadEmailAfterMs: (Number(process.env.CHAT_UNREAD_EMAIL_MINUTES) || 15) * 60 * 1000,
  },
  /** Without these, upload endpoints answer 503 */
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'shared-ownership',
  },
};

module.exports = config;
