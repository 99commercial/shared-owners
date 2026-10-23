const User = require('../../../models/User');
const ApiError = require('../../../utils/ApiError');
const { isValidObjectId } = require('../../../utils/validators');
const developmentService = require('../../../utils/development.service');
const { ACCOUNT_SUMMARY_FIELDS } = require('../../../utils/profile.service');

/** Every development on the platform. Filters: owner (company id), status, search, page, limit */
const listDevelopments = (query = {}) => {
  const filter = { isDeleted: false };
  if (query.owner !== undefined) {
    if (!isValidObjectId(query.owner)) {
      throw new ApiError(400, 'owner must be a valid id');
    }
    filter.owner = query.owner;
  }
  return developmentService.queryDevelopments(filter, query, { populate: true });
};

const getDevelopment = async (developmentId) => {
  const development = await developmentService.getDevelopmentById(developmentId);
  const [owner, createdBy] = await Promise.all([
    User.findById(development.owner).select(ACCOUNT_SUMMARY_FIELDS).lean(),
    User.findById(development.createdBy).select(ACCOUNT_SUMMARY_FIELDS).lean(),
  ]);
  return { development, owner, createdBy };
};

const deleteDevelopment = (admin, developmentId) =>
  developmentService.deleteDevelopment(developmentId, admin.id);

module.exports = {
  listDevelopments,
  getDevelopment,
  deleteDevelopment,
};
