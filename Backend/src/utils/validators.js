const { PERSONAL_EMAIL_DOMAINS } = require('../common/emailDomains');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 8;

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isValidEmail = (value) =>
  isNonEmptyString(value) && EMAIL_REGEX.test(value.trim());

const isValidPassword = (value) =>
  typeof value === 'string' && value.length >= MIN_PASSWORD_LENGTH;

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const pick = (source, keys) =>
  keys.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});

const isValidObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

const normaliseEmail = (value) => value.trim().toLowerCase();

const getEmailDomain = (email) => normaliseEmail(email).split('@')[1];

/** Organisation accounts must not use personal mailbox providers */
const isCompanyEmail = (email) =>
  isValidEmail(email) && !PERSONAL_EMAIL_DOMAINS.has(getEmailDomain(email));

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  MIN_PASSWORD_LENGTH,
  isNonEmptyString,
  isValidEmail,
  isValidPassword,
  isPlainObject,
  isValidObjectId,
  normaliseEmail,
  getEmailDomain,
  isCompanyEmail,
  escapeRegex,
  pick,
};
