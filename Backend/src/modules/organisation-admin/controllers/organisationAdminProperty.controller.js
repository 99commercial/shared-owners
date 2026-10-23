const asyncHandler = require('../../../utils/asyncHandler');
const organisationAdminPropertyService = require('../services/organisationAdminProperty.service');

const createProperty = asyncHandler(async (req, res) => {
  const property = await organisationAdminPropertyService.createProperty(req.user, req.body);
  res.status(201).json({ success: true, data: { property } });
});

const listProperties = asyncHandler(async (req, res) => {
  const data = await organisationAdminPropertyService.listProperties(req.user, req.query);
  res.status(200).json({ success: true, data });
});

const getProperty = asyncHandler(async (req, res) => {
  const property = await organisationAdminPropertyService.getProperty(
    req.user,
    req.params.propertyId
  );
  res.status(200).json({ success: true, data: { property } });
});

const saveSection = asyncHandler(async (req, res) => {
  const property = await organisationAdminPropertyService.saveSection(
    req.user,
    req.params.propertyId,
    req.params.section,
    req.body
  );
  res.status(200).json({ success: true, data: { property } });
});

const deleteProperty = asyncHandler(async (req, res) => {
  await organisationAdminPropertyService.deleteProperty(req.user, req.params.propertyId);
  res.status(200).json({ success: true, message: 'Property deleted' });
});

module.exports = {
  createProperty,
  listProperties,
  getProperty,
  saveSection,
  deleteProperty,
};
