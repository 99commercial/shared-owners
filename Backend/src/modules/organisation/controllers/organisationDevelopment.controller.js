const asyncHandler = require('../../../utils/asyncHandler');
const organisationDevelopmentService = require('../services/organisationDevelopment.service');

const createDevelopment = asyncHandler(async (req, res) => {
  const development = await organisationDevelopmentService.createDevelopment(req.user.id, req.body);
  res.status(201).json({ success: true, data: { development } });
});

const listDevelopments = asyncHandler(async (req, res) => {
  const data = await organisationDevelopmentService.listDevelopments(req.user.id, req.query);
  res.status(200).json({ success: true, data });
});

const getDevelopment = asyncHandler(async (req, res) => {
  const development = await organisationDevelopmentService.getDevelopment(
    req.user.id,
    req.params.developmentId
  );
  res.status(200).json({ success: true, data: { development } });
});

const saveSection = asyncHandler(async (req, res) => {
  const development = await organisationDevelopmentService.saveSection(
    req.user.id,
    req.params.developmentId,
    req.params.section,
    req.body
  );
  res.status(200).json({ success: true, data: { development } });
});

const deleteDevelopment = asyncHandler(async (req, res) => {
  await organisationDevelopmentService.deleteDevelopment(req.user.id, req.params.developmentId);
  res.status(200).json({ success: true, message: 'Development deleted' });
});

module.exports = {
  createDevelopment,
  listDevelopments,
  getDevelopment,
  saveSection,
  deleteDevelopment,
};
