const asyncHandler = require('../../../utils/asyncHandler');
const blogService = require('../../../utils/blog.service');
const contactQueryService = require('../../../utils/contactQuery.service');

// ── Blog posts ───────────────────────────────────────────────────────────

const listBlogs = asyncHandler(async (req, res) => {
  const data = await blogService.listBlogs(req.query);
  res.status(200).json({ success: true, data });
});

const getBlog = asyncHandler(async (req, res) => {
  const blog = await blogService.getBlog(req.params.blogId);
  res.status(200).json({ success: true, data: { blog } });
});

const createBlog = asyncHandler(async (req, res) => {
  const blog = await blogService.createBlog(req.user, req.body);
  res.status(201).json({ success: true, message: 'Blog post created', data: { blog } });
});

const updateBlog = asyncHandler(async (req, res) => {
  const blog = await blogService.updateBlog(req.user, req.params.blogId, req.body);
  res.status(200).json({ success: true, message: 'Blog post saved', data: { blog } });
});

const deleteBlog = asyncHandler(async (req, res) => {
  const data = await blogService.deleteBlog(req.params.blogId);
  res.status(200).json({ success: true, message: 'Blog post deleted', data });
});

const uploadBlogImage = asyncHandler(async (req, res) => {
  const data = await blogService.uploadImageForPost(req.file.buffer);
  res.status(201).json({ success: true, data });
});

// ── Contact queries ──────────────────────────────────────────────────────

const listContactQueries = asyncHandler(async (req, res) => {
  const data = await contactQueryService.listQueries(req.query);
  res.status(200).json({ success: true, data });
});

const getContactQuery = asyncHandler(async (req, res) => {
  const query = await contactQueryService.getQuery(req.user, req.params.queryId);
  res.status(200).json({ success: true, data: { query } });
});

const updateContactQuery = asyncHandler(async (req, res) => {
  const query = await contactQueryService.updateQuery(req.user, req.params.queryId, req.body);
  res.status(200).json({ success: true, message: 'Query updated', data: { query } });
});

const deleteContactQuery = asyncHandler(async (req, res) => {
  const data = await contactQueryService.deleteQuery(req.params.queryId);
  res.status(200).json({ success: true, message: 'Query deleted', data });
});

module.exports = {
  listBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadBlogImage,
  listContactQueries,
  getContactQuery,
  updateContactQuery,
  deleteContactQuery,
};
