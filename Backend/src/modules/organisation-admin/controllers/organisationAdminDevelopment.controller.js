const asyncHandler = require('../../../utils/asyncHandler');
const organisationAdminDevelopmentService = require('../services/organisationAdminDevelopment.service');

const createDevelopment = asyncHandler(async (req, res) => {
  const development = await organisationAdminDevelopmentService.createDevelopment(req.user, req.body);
  res.status(201).json({ success: true, data: { development } });
});

const listDevelopments = asyncHandler(async (req, res) => {
  const data = await organisationAdminDevelopmentService.listDevelopments(req.user, req.query);
  res.status(200).json({ success: true, data });
});

const getDevelopment = asyncHandler(async (req, res) => {
  const development = await organisationAdminDevelopmentService.getDevelopment(
    req.user,
    req.params.developmentId
  );
  res.status(200).json({ success: true, data: { development } });
});

const saveSection = asyncHandler(async (req, res) => {
  const development = await organisationAdminDevelopmentService.saveSection(
    req.user,
    req.params.developmentId,
    req.params.section,
    req.body
  );
  res.status(200).json({ success: true, data: { development } });
});

const deleteDevelopment = asyncHandler(async (req, res) => {
  await organisationAdminDevelopmentService.deleteDevelopment(req.user, req.params.developmentId);
  res.status(200).json({ success: true, message: 'Development deleted' });
});

module.exports = {
  createDevelopment,
  listDevelopments,
  getDevelopment,
  saveSection,
  deleteDevelopment,
};
