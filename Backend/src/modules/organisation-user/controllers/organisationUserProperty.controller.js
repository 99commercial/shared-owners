const asyncHandler = require('../../../utils/asyncHandler');
const organisationUserPropertyService = require('../services/organisationUserProperty.service');

const createProperty = asyncHandler(async (req, res) => {
  const property = await organisationUserPropertyService.createProperty(req.user, req.body);
  res.status(201).json({ success: true, data: { property } });
});

const listProperties = asyncHandler(async (req, res) => {
  const data = await organisationUserPropertyService.listProperties(req.user, req.query);
  res.status(200).json({ success: true, data });
});

const getProperty = asyncHandler(async (req, res) => {
  const property = await organisationUserPropertyService.getProperty(
    req.user,
    req.params.propertyId
  );
  res.status(200).json({ success: true, data: { property } });
});

const saveSection = asyncHandler(async (req, res) => {
  const property = await organisationUserPropertyService.saveSection(
    req.user,
    req.params.propertyId,
    req.params.section,
    req.body
  );
  res.status(200).json({ success: true, data: { property } });
});

module.exports = {
  createProperty,
  listProperties,
  getProperty,
  saveSection,
};
