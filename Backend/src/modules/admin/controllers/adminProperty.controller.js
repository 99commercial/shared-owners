const asyncHandler = require('../../../utils/asyncHandler');
const adminPropertyService = require('../services/adminProperty.service');
const adminPropertyApprovalService = require('../services/adminPropertyApproval.service');

const listProperties = asyncHandler(async (req, res) => {
  const data = await adminPropertyService.listProperties(req.query);
  res.status(200).json({ success: true, data });
});

const getProperty = asyncHandler(async (req, res) => {
  const data = await adminPropertyService.getProperty(req.params.propertyId);
  res.status(200).json({ success: true, data });
});

const deleteProperty = asyncHandler(async (req, res) => {
  await adminPropertyService.deleteProperty(req.user, req.params.propertyId);
  res.status(200).json({ success: true, message: 'Property deleted' });
});

const listApprovals = asyncHandler(async (req, res) => {
  const data = await adminPropertyApprovalService.listApprovals(req.query);
  res.status(200).json({ success: true, data });
});

const getApproval = asyncHandler(async (req, res) => {
  const data = await adminPropertyApprovalService.getApproval(req.params.propertyId);
  res.status(200).json({ success: true, data });
});

const approveProperty = asyncHandler(async (req, res) => {
  const property = await adminPropertyApprovalService.approve(req.user, req.params.propertyId);
  res.status(200).json({ success: true, message: 'Property approved and live', data: { property } });
});

const rejectProperty = asyncHandler(async (req, res) => {
  const property = await adminPropertyApprovalService.reject(
    req.user,
    req.params.propertyId,
    req.body
  );
  res.status(200).json({ success: true, message: 'Property rejected', data: { property } });
});

module.exports = {
  listProperties,
  getProperty,
  deleteProperty,
  listApprovals,
  getApproval,
  approveProperty,
  rejectProperty,
};
