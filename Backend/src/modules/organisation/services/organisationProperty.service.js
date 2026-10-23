const propertyService = require('../../../utils/property.service');

/** Organisation listings go live as soon as every required section is complete */
const ownerContext = (organisationId) => ({
  ownerType: 'organisation',
  ownerId: organisationId,
  actorId: organisationId,
  requiresApproval: false,
});

const createProperty = (organisationId, body) =>
  propertyService.createProperty(ownerContext(organisationId), body);

const saveSection = (organisationId, propertyId, section, body) =>
  propertyService.saveSection(ownerContext(organisationId), propertyId, section, body);

const getProperty = (organisationId, propertyId) =>
  propertyService.getProperty(ownerContext(organisationId), propertyId);

/** Every listing owned by the organisation, including ones its admins / users created */
const listProperties = (organisationId, query) =>
  propertyService.listProperties(ownerContext(organisationId), query);

const deleteProperty = (organisationId, propertyId) =>
  propertyService.deleteProperty(propertyId, organisationId, {
    ownerType: 'organisation',
    owner: organisationId,
  });

module.exports = {
  createProperty,
  saveSection,
  getProperty,
  listProperties,
  deleteProperty,
};
