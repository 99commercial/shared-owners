const asyncHandler = require('../../../utils/asyncHandler');
const adminDevelopmentService = require('../services/adminDevelopment.service');

const listDevelopments = asyncHandler(async (req, res) => {
  const data = await adminDevelopmentService.listDevelopments(req.query);
  res.status(200).json({ success: true, data });
});

const getDevelopment = asyncHandler(async (req, res) => {
  const data = await adminDevelopmentService.getDevelopment(req.params.developmentId);
  res.status(200).json({ success: true, data });
});

const deleteDevelopment = asyncHandler(async (req, res) => {
  await adminDevelopmentService.deleteDevelopment(req.user, req.params.developmentId);
  res.status(200).json({ success: true, message: 'Development deleted' });
});

module.exports = {
  listDevelopments,
  getDevelopment,
  deleteDevelopment,
};
