const propertyService = require('../../../utils/property.service');

/** Individual users own their listings, and every complete version needs admin approval */
const ownerContext = (userId) => ({
  ownerType: 'user',
  ownerId: userId,
  actorId: userId,
  requiresApproval: true,
});

const createProperty = (userId, body) => propertyService.createProperty(ownerContext(userId), body);

const saveSection = (userId, propertyId, section, body) =>
  propertyService.saveSection(ownerContext(userId), propertyId, section, body);

const getProperty = (userId, propertyId) =>
  propertyService.getProperty(ownerContext(userId), propertyId);

const listProperties = (userId, query) =>
  propertyService.listProperties(ownerContext(userId), query);

const deleteProperty = (userId, propertyId) =>
  propertyService.deleteProperty(propertyId, userId, { ownerType: 'user', owner: userId });

module.exports = {
  createProperty,
  saveSection,
  getProperty,
  listProperties,
  deleteProperty,
};
