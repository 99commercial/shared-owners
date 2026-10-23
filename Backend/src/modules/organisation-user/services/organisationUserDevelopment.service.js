const developmentService = require('../../../utils/development.service');

/**
 * Same rules as properties: only developments the user created or is assigned
 * to, publishing only submits for approval, and there is no delete.
 * `user` is req.user: { id, organisationId }.
 */
const ownerContext = (user) => ({
  ownerId: user.organisationId,
  actorId: user.id,
  memberId: user.id,
  requiresApproval: true,
});

const createDevelopment = (user, body) =>
  developmentService.createDevelopment(ownerContext(user), body);

const saveSection = (user, developmentId, section, body) =>
  developmentService.saveSection(ownerContext(user), developmentId, section, body);

const getDevelopment = (user, developmentId) =>
  developmentService.getDevelopment(ownerContext(user), developmentId);

const listDevelopments = (user, query) =>
  developmentService.listDevelopments(ownerContext(user), query);

const getDevelopmentCounts = (user) => developmentService.getDevelopmentCounts(ownerContext(user));

module.exports = {
  createDevelopment,
  saveSection,
  getDevelopment,
  listDevelopments,
  getDevelopmentCounts,
};
