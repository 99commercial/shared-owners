const ApiError = require('./ApiError');

/** The API speaks pounds; the database stores whole pence */
const poundsToPence = (pounds, field) => {
  if (pounds === null || pounds === undefined || pounds === '') return undefined;
  const n = Number(pounds);
  if (!Number.isFinite(n) || n < 0) {
    throw new ApiError(400, `${field} must be a positive amount in pounds`);
  }
  return Math.round(n * 100);
};

const penceToPounds = (pence) =>
  pence === null || pence === undefined ? pence : pence / 100;

module.exports = { poundsToPence, penceToPounds };
