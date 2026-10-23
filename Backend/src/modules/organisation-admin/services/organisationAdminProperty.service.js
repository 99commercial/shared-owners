const propertyService = require('../../../utils/property.service');

/**
 * Admins work on the organisation's listings: the organisation is the owner,
 * the admin is recorded as creator / editor, and complete listings go live
 * without approval. `admin` is req.user: { id, organisationId }.
 */
const ownerContext = (admin) => ({
  ownerType: 'organisation',
  ownerId: admin.organisationId,
  actorId: admin.id,
  requiresApproval: false,
});

const createProperty = (admin, body) => propertyService.createProperty(ownerContext(admin), body);

const saveSection = (admin, propertyId, section, body) =>
  propertyService.saveSection(ownerContext(admin), propertyId, section, body);

const getProperty = (admin, propertyId) =>
  propertyService.getProperty(ownerContext(admin), propertyId);

/** Every listing owned by the organisation, whoever created it */
const listProperties = (admin, query) =>
  propertyService.listProperties(ownerContext(admin), query);

const deleteProperty = (admin, propertyId) =>
  propertyService.deleteProperty(propertyId, admin.id, {
    ownerType: 'organisation',
    owner: admin.organisationId,
  });

module.exports = {
  createProperty,
  saveSection,
  getProperty,
  listProperties,
  deleteProperty,
};
