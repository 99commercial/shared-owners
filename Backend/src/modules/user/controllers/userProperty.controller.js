const asyncHandler = require('../../../utils/asyncHandler');
const userPropertyService = require('../services/userProperty.service');

const createProperty = asyncHandler(async (req, res) => {
  const property = await userPropertyService.createProperty(req.user.id, req.body);
  res.status(201).json({ success: true, data: { property } });
});

const listProperties = asyncHandler(async (req, res) => {
  const data = await userPropertyService.listProperties(req.user.id, req.query);
  res.status(200).json({ success: true, data });
});

const getProperty = asyncHandler(async (req, res) => {
  const property = await userPropertyService.getProperty(req.user.id, req.params.propertyId);
  res.status(200).json({ success: true, data: { property } });
});

const saveSection = asyncHandler(async (req, res) => {
  const property = await userPropertyService.saveSection(
    req.user.id,
    req.params.propertyId,
    req.params.section,
    req.body
  );
  res.status(200).json({ success: true, data: { property } });
});

const deleteProperty = asyncHandler(async (req, res) => {
  await userPropertyService.deleteProperty(req.user.id, req.params.propertyId);
  res.status(200).json({ success: true, message: 'Property deleted' });
});

module.exports = {
  createProperty,
  listProperties,
  getProperty,
  saveSection,
  deleteProperty,
};
