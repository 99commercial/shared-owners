const developmentService = require('../../../utils/development.service');

/**
 * Same rules as their properties: admins work on every development the
 * organisation owns, publish without approval and can delete.
 * `admin` is req.user: { id, organisationId }.
 */
const ownerContext = (admin) => ({
  ownerId: admin.organisationId,
  actorId: admin.id,
  requiresApproval: false,
});

const createDevelopment = (admin, body) =>
  developmentService.createDevelopment(ownerContext(admin), body);

const saveSection = (admin, developmentId, section, body) =>
  developmentService.saveSection(ownerContext(admin), developmentId, section, body);

const getDevelopment = (admin, developmentId) =>
  developmentService.getDevelopment(ownerContext(admin), developmentId);

const listDevelopments = (admin, query) =>
  developmentService.listDevelopments(ownerContext(admin), query);

const deleteDevelopment = (admin, developmentId) =>
  developmentService.deleteOwnedDevelopment(ownerContext(admin), developmentId);

module.exports = {
  createDevelopment,
  saveSection,
  getDevelopment,
  listDevelopments,
  deleteDevelopment,
};
