const developmentService = require('../../../utils/development.service');

/** The organisation owns and edits its developments; publishing goes live without approval */
const ownerContext = (organisationId) => ({
  ownerId: organisationId,
  actorId: organisationId,
  requiresApproval: false,
});

const createDevelopment = (organisationId, body) =>
  developmentService.createDevelopment(ownerContext(organisationId), body);

const saveSection = (organisationId, developmentId, section, body) =>
  developmentService.saveSection(ownerContext(organisationId), developmentId, section, body);

const getDevelopment = (organisationId, developmentId) =>
  developmentService.getDevelopment(ownerContext(organisationId), developmentId);

/** Every development owned by the organisation, including ones its admins / users created */
const listDevelopments = (organisationId, query) =>
  developmentService.listDevelopments(ownerContext(organisationId), query);

const deleteDevelopment = (organisationId, developmentId) =>
  developmentService.deleteOwnedDevelopment(ownerContext(organisationId), developmentId);

module.exports = {
  createDevelopment,
  saveSection,
  getDevelopment,
  listDevelopments,
  deleteDevelopment,
};
