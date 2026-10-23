const User = require('../../../models/User');
const ApiError = require('../../../utils/ApiError');
const { OWNER_TYPES } = require('../../../common/propertyOptions');
const { isValidObjectId } = require('../../../utils/validators');
const propertyService = require('../../../utils/property.service');
const { ACCOUNT_SUMMARY_FIELDS } = require('../../../utils/profile.service');

const idFilter = (query, key) => {
  if (query[key] === undefined) return {};
  if (!isValidObjectId(query[key])) {
    throw new ApiError(400, `${key} must be a valid id`);
  }
  return { [key]: query[key] };
};

/**
 * Every listing on the platform. Filters: ownerType (user|organisation),
 * owner (user or company id), createdBy, development, status,
 * approvalType (create|edit), search, page, limit
 */
const listProperties = (query = {}) => {
  if (query.ownerType !== undefined && !OWNER_TYPES.includes(query.ownerType)) {
    throw new ApiError(400, `ownerType must be one of: ${OWNER_TYPES.join(', ')}`);
  }
  const filter = {
    isDeleted: false,
    ...(query.ownerType && { ownerType: query.ownerType }),
    ...idFilter(query, 'owner'),
    ...idFilter(query, 'createdBy'),
    ...idFilter(query, 'development'),
  };
  return propertyService.queryProperties(filter, query, { populate: true });
};

const getProperty = async (propertyId) => {
  const property = await propertyService.getPropertyById(propertyId);
  const [owner, createdBy] = await Promise.all([
    User.findById(property.owner).select(ACCOUNT_SUMMARY_FIELDS).lean(),
    User.findById(property.createdBy).select(ACCOUNT_SUMMARY_FIELDS).lean(),
  ]);
  return { property, owner, createdBy };
};

const deleteProperty = (admin, propertyId) => propertyService.deleteProperty(propertyId, admin.id);

module.exports = {
  listProperties,
  getProperty,
  deleteProperty,
};
