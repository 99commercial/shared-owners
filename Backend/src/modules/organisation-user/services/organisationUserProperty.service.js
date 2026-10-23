const propertyService = require('../../../utils/property.service');

/**
 * Organisation users work on the organisation's listings, but only ones they
 * created or are assigned to. Complete listings are submitted for approval by
 * the organisation instead of going live. There is no delete for this role.
 * `user` is req.user: { id, organisationId }.
 */
const ownerContext = (user) => ({
  ownerType: 'organisation',
  ownerId: user.organisationId,
  actorId: user.id,
  memberId: user.id,
  requiresApproval: true,
});

const createProperty = (user, body) => propertyService.createProperty(ownerContext(user), body);

const saveSection = (user, propertyId, section, body) =>
  propertyService.saveSection(ownerContext(user), propertyId, section, body);

const getProperty = (user, propertyId) =>
  propertyService.getProperty(ownerContext(user), propertyId);

const listProperties = (user, query) => propertyService.listProperties(ownerContext(user), query);

const getPropertyAnalytics = (user) => propertyService.getPropertyAnalytics(ownerContext(user));

module.exports = {
  createProperty,
  saveSection,
  getProperty,
  listProperties,
  getPropertyAnalytics,
};
