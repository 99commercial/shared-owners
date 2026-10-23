const User = require('../../../models/User');
const { PROPERTY_STATUS } = require('../../../common/propertyOptions');
const propertyService = require('../../../utils/property.service');
const { ACCOUNT_SUMMARY_FIELDS } = require('../../../utils/profile.service');

/**
 * Individual users' listings that are fully complete but need a platform admin
 * before going live. Organisation listings (company, company admins, company
 * users) never come here, and individual users have no developments.
 */
const USER_LISTINGS = Object.freeze({ ownerType: 'user' });

const QUEUE_FILTER = Object.freeze({
  ...USER_LISTINGS,
  isDeleted: false,
  status: PROPERTY_STATUS.PENDING_APPROVAL,
  'completion.isComplete': true,
});

/** Oldest submission first. Filters: approvalType (create = never been live, edit), search, page, limit */
const listApprovals = (query = {}) => {
  const rest = { ...query };
  delete rest.status;
  return propertyService.queryProperties(QUEUE_FILTER, rest, {
    populate: true,
    sort: { 'approval.submittedAt': 1 },
  });
};

const getApproval = async (propertyId) => {
  const property = await propertyService.getPropertyById(propertyId, {
    ...USER_LISTINGS,
    status: PROPERTY_STATUS.PENDING_APPROVAL,
  });
  const owner = await User.findById(property.owner).select(ACCOUNT_SUMMARY_FIELDS).lean();
  return { property, owner };
};

const approve = (admin, propertyId) =>
  propertyService.reviewProperty(propertyId, admin.id, { approve: true }, USER_LISTINGS);

const reject = (admin, propertyId, body = {}) =>
  propertyService.reviewProperty(propertyId, admin.id, { approve: false, reason: body.reason }, USER_LISTINGS);

module.exports = {
  listApprovals,
  getApproval,
  approve,
  reject,
};
