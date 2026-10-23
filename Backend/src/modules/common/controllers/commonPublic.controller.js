const asyncHandler = require('../../../utils/asyncHandler');
const commonPublicService = require('../services/commonPublic.service');
const blogService = require('../../../utils/blog.service');
const contactQueryService = require('../../../utils/contactQuery.service');
const { getClientInfo } = require('../../../utils/requestInfo');

/** GET /api/common/blogs */
const listBlogs = asyncHandler(async (req, res) => {
  const data = await blogService.listPublishedBlogs(req.query);
  res.status(200).json({ success: true, data });
});

/** GET /api/common/blogs/:slug */
const getBlog = asyncHandler(async (req, res) => {
  const data = await blogService.getPublishedBlog(req.params.slug);
  res.status(200).json({ success: true, data });
});

/** POST /api/common/contact */
const submitContactQuery = asyncHandler(async (req, res) => {
  const data = await contactQueryService.submitQuery(req.body, getClientInfo(req));
  res.status(201).json({ success: true, message: "Thanks for getting in touch. We'll reply soon.", data });
});

/** GET /api/common/properties */
const listProperties = asyncHandler(async (req, res) => {
  const data = await commonPublicService.listProperties(req.query);
  res.status(200).json({ success: true, data });
});

/** GET /api/common/properties/:propertyId */
const getProperty = asyncHandler(async (req, res) => {
  const data = await commonPublicService.getProperty(req.params.propertyId);
  res.status(200).json({ success: true, data });
});

/** GET /api/common/developments */
const listDevelopments = asyncHandler(async (req, res) => {
  const data = await commonPublicService.listDevelopments(req.query);
  res.status(200).json({ success: true, data });
});

/** GET /api/common/developments/:developmentId */
const getDevelopment = asyncHandler(async (req, res) => {
  const data = await commonPublicService.getDevelopment(req.params.developmentId);
  res.status(200).json({ success: true, data });
});

/** GET /api/common/organisations */
const listOrganisations = asyncHandler(async (req, res) => {
  const data = await commonPublicService.listOrganisations(req.query);
  res.status(200).json({ success: true, data });
});

/** GET /api/common/organisations/:slug */
const getOrganisation = asyncHandler(async (req, res) => {
  const data = await commonPublicService.getOrganisation(req.params.slug);
  res.status(200).json({ success: true, data });
});

module.exports = {
  listBlogs,
  getBlog,
  submitContactQuery,
  listProperties,
  getProperty,
  listDevelopments,
  getDevelopment,
  listOrganisations,
  getOrganisation,
};
