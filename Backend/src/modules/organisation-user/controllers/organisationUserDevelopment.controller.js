const asyncHandler = require('../../../utils/asyncHandler');
const organisationUserDevelopmentService = require('../services/organisationUserDevelopment.service');

const createDevelopment = asyncHandler(async (req, res) => {
  const development = await organisationUserDevelopmentService.createDevelopment(req.user, req.body);
  res.status(201).json({ success: true, data: { development } });
});

const listDevelopments = asyncHandler(async (req, res) => {
  const data = await organisationUserDevelopmentService.listDevelopments(req.user, req.query);
  res.status(200).json({ success: true, data });
});

const getDevelopment = asyncHandler(async (req, res) => {
  const development = await organisationUserDevelopmentService.getDevelopment(
    req.user,
    req.params.developmentId
  );
  res.status(200).json({ success: true, data: { development } });
});

const saveSection = asyncHandler(async (req, res) => {
  const development = await organisationUserDevelopmentService.saveSection(
    req.user,
    req.params.developmentId,
    req.params.section,
    req.body
  );
  res.status(200).json({ success: true, data: { development } });
});

module.exports = {
  createDevelopment,
  listDevelopments,
  getDevelopment,
  saveSection,
};
