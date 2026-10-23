const ContactQuery = require('../models/ContactQuery');
const ApiError = require('./ApiError');
const { CONTACT_QUERY_STATUS, CONTACT_QUERY_STATUS_VALUES } = require('../common/contentOptions');
const {
  isPlainObject,
  isNonEmptyString,
  isValidEmail,
  isValidObjectId,
  normaliseEmail,
  escapeRegex,
} = require('./validators');
const { parsePagination, buildPage } = require('./pagination');
const { ACCOUNT_SUMMARY_FIELDS } = require('./profile.service');

const PHONE_REGEX = /^\+?[\d\s()-]{7,20}$/;

const requiredText = (value, field, max) => {
  if (!isNonEmptyString(value)) throw new ApiError(400, `${field} is required`);
  if (value.trim().length > max) throw new ApiError(400, `${field} must be ${max} characters or fewer`);
  return value.trim();
};

/** Public Contact Us form. Body: { name, email, phone?, subject, message } */
const submitQuery = async (body, client = {}) => {
  if (!isPlainObject(body)) throw new ApiError(400, 'Request body must be an object');
  if (!isValidEmail(body.email)) throw new ApiError(400, 'A valid email is required');
  if (body.phone && (typeof body.phone !== 'string' || !PHONE_REGEX.test(body.phone.trim()))) {
    throw new ApiError(400, 'Enter a valid phone number');
  }

  const query = await ContactQuery.create({
    name: requiredText(body.name, 'name', 120),
    email: normaliseEmail(body.email),
    phone: body.phone ? body.phone.trim() : undefined,
    subject: requiredText(body.subject, 'subject', 200),
    message: requiredText(body.message, 'message', 5000),
    ip: client.ip,
    userAgent: client.userAgent,
  });
  return { _id: query._id };
};

const findQuery = async (queryId) => {
  if (!isValidObjectId(queryId)) throw new ApiError(400, 'Invalid query id');
  const query = await ContactQuery.findById(queryId);
  if (!query) throw new ApiError(404, 'Query not found');
  return query;
};

/** Filters: search (name / email / subject / message), status, page, limit. Also returns counts per status. */
const listQueries = async (query = {}) => {
  const paging = parsePagination(query);
  const filter = {};
  if (query.status !== undefined && query.status !== '') {
    if (!CONTACT_QUERY_STATUS_VALUES.includes(query.status)) {
      throw new ApiError(400, `status must be one of: ${CONTACT_QUERY_STATUS_VALUES.join(', ')}`);
    }
    filter.status = query.status;
  }
  if (isNonEmptyString(query.search)) {
    const pattern = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { subject: pattern }, { message: pattern }];
  }

  const [items, total, statusRows] = await Promise.all([
    ContactQuery.find(filter)
      .sort({ createdAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit)
      .populate('handledBy', ACCOUNT_SUMMARY_FIELDS)
      .lean(),
    ContactQuery.countDocuments(filter),
    ContactQuery.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const counts = Object.fromEntries(
    CONTACT_QUERY_STATUS_VALUES.map((s) => [s, statusRows.find((r) => r._id === s)?.count || 0])
  );
  return { ...buildPage(items, total, paging), counts };
};

/** Opening a new query marks it read */
const getQuery = async (admin, queryId) => {
  const query = await findQuery(queryId);
  if (query.status === CONTACT_QUERY_STATUS.NEW) {
    query.status = CONTACT_QUERY_STATUS.READ;
    query.handledBy = admin.id;
    query.handledAt = new Date();
    await query.save();
  }
  return query.populate('handledBy', ACCOUNT_SUMMARY_FIELDS);
};

/** Body: { status?, adminNote? } */
const updateQuery = async (admin, queryId, body) => {
  if (!isPlainObject(body)) throw new ApiError(400, 'Request body must be an object');
  const query = await findQuery(queryId);
  if (body.status === undefined && body.adminNote === undefined) {
    throw new ApiError(400, 'Provide status and/or adminNote');
  }
  if (body.status !== undefined) {
    if (!CONTACT_QUERY_STATUS_VALUES.includes(body.status)) {
      throw new ApiError(400, `status must be one of: ${CONTACT_QUERY_STATUS_VALUES.join(', ')}`);
    }
    query.status = body.status;
  }
  if (body.adminNote !== undefined) {
    if (body.adminNote !== null && typeof body.adminNote !== 'string') throw new ApiError(400, 'adminNote must be text');
    if ((body.adminNote || '').length > 2000) throw new ApiError(400, 'adminNote must be 2000 characters or fewer');
    query.adminNote = body.adminNote ? body.adminNote.trim() : undefined;
  }
  query.handledBy = admin.id;
  query.handledAt = new Date();
  await query.save();
  return query.populate('handledBy', ACCOUNT_SUMMARY_FIELDS);
};

const deleteQuery = async (queryId) => {
  const query = await findQuery(queryId);
  await query.deleteOne();
  return { _id: query._id };
};

module.exports = { submitQuery, listQueries, getQuery, updateQuery, deleteQuery };
