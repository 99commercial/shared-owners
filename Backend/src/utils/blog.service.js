const crypto = require('crypto');
const Blog = require('../models/Blog');
const ApiError = require('./ApiError');
const {
  BLOG_STATUS,
  BLOG_STATUS_VALUES,
  BLOG_CATEGORIES,
  MAX_BLOG_TAGS,
  MAX_BLOG_EXCERPT,
} = require('../common/contentOptions');
const { isPlainObject, isNonEmptyString, isValidObjectId, escapeRegex } = require('./validators');
const { parsePagination, buildPage } = require('./pagination');
const { sanitizeArticleHtml, htmlToPlainText } = require('./richText');
const { uploadImage, deleteImage, cloudinaryFolder } = require('./cloudinary');
const { ACCOUNT_SUMMARY_FIELDS } = require('./profile.service');

const WORDS_PER_MINUTE = 200;
const COVER_SUBFOLDER = 'blogs';
const COVER_TRANSFORMATION = [
  { width: 1600, height: 900, crop: 'limit' },
  { quality: 'auto', fetch_format: 'auto' },
];
const LIST_FIELDS = '-content';
const HTTPS_URL = /^https:\/\/\S+$/i;

const slugify = (value) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);

const uniqueSlug = async (source, excludeId) => {
  const base = slugify(source) || 'post';
  let slug = base;
  let suffix = 1;
  while (await Blog.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
};

const optionalText = (value, field, max) => {
  if (value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new ApiError(400, `${field} must be text`);
  if (value.trim().length > max) throw new ApiError(400, `${field} must be ${max} characters or fewer`);
  return value.trim();
};

/** Only the fields present in `body` are returned, validated and normalised */
const normalise = (body, { creating }) => {
  if (!isPlainObject(body)) throw new ApiError(400, 'Request body must be an object');
  const out = {};

  if (creating || body.title !== undefined) {
    if (!isNonEmptyString(body.title)) throw new ApiError(400, 'title is required');
    if (body.title.trim().length > 160) throw new ApiError(400, 'title must be 160 characters or fewer');
    out.title = body.title.trim();
  }
  if (body.slug !== undefined && body.slug !== '') {
    if (typeof body.slug !== 'string' || !slugify(body.slug)) throw new ApiError(400, 'slug must contain letters or numbers');
    out.slug = slugify(body.slug);
  }
  if (body.excerpt !== undefined) out.excerpt = optionalText(body.excerpt, 'excerpt', MAX_BLOG_EXCERPT);
  if (body.content !== undefined) {
    if (typeof body.content !== 'string') throw new ApiError(400, 'content must be HTML text');
    out.content = sanitizeArticleHtml(body.content);
    const words = htmlToPlainText(out.content).split(' ').filter(Boolean).length;
    out.readingMinutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  }
  if (body.coverImageUrl !== undefined) {
    if (body.coverImageUrl && !HTTPS_URL.test(body.coverImageUrl)) {
      throw new ApiError(400, 'coverImageUrl must be an https URL');
    }
    out.coverImageUrl = body.coverImageUrl || undefined;
  }
  if (body.category !== undefined) {
    if (body.category && !BLOG_CATEGORIES.includes(body.category)) {
      throw new ApiError(400, `category must be one of: ${BLOG_CATEGORIES.join(', ')}`);
    }
    out.category = body.category || undefined;
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== 'string')) {
      throw new ApiError(400, 'tags must be a list of words');
    }
    const tags = [...new Set(body.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))];
    if (tags.length > MAX_BLOG_TAGS) throw new ApiError(400, `A maximum of ${MAX_BLOG_TAGS} tags is allowed`);
    out.tags = tags;
  }
  if (body.status !== undefined) {
    if (!BLOG_STATUS_VALUES.includes(body.status)) {
      throw new ApiError(400, `status must be one of: ${BLOG_STATUS_VALUES.join(', ')}`);
    }
    out.status = body.status;
  }
  if (body.isFeatured !== undefined) {
    if (typeof body.isFeatured !== 'boolean') throw new ApiError(400, 'isFeatured must be true or false');
    out.isFeatured = body.isFeatured;
  }
  if (body.seo !== undefined) {
    if (!isPlainObject(body.seo)) throw new ApiError(400, 'seo must be an object');
    out.seo = {
      metaTitle: optionalText(body.seo.metaTitle, 'seo.metaTitle', 70),
      metaDescription: optionalText(body.seo.metaDescription, 'seo.metaDescription', 160),
    };
  }
  return out;
};

const findBlog = async (blogId) => {
  if (!isValidObjectId(blogId)) throw new ApiError(400, 'Invalid blog id');
  const blog = await Blog.findById(blogId);
  if (!blog) throw new ApiError(404, 'Blog post not found');
  return blog;
};

const listFilter = (query, base = {}) => {
  const filter = { ...base };
  if (query.category !== undefined && query.category !== '') {
    if (!BLOG_CATEGORIES.includes(query.category)) {
      throw new ApiError(400, `category must be one of: ${BLOG_CATEGORIES.join(', ')}`);
    }
    filter.category = query.category;
  }
  if (isNonEmptyString(query.search)) {
    const pattern = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [{ title: pattern }, { excerpt: pattern }, { tags: pattern }];
  }
  return filter;
};

// ── Admin ────────────────────────────────────────────────────────────────

/** Filters: search, status, category, page, limit. Also returns counts per status. */
const listBlogs = async (query = {}) => {
  const paging = parsePagination(query);
  const filter = listFilter(query);
  if (query.status !== undefined && query.status !== '') {
    if (!BLOG_STATUS_VALUES.includes(query.status)) {
      throw new ApiError(400, `status must be one of: ${BLOG_STATUS_VALUES.join(', ')}`);
    }
    filter.status = query.status;
  }

  const [items, total, statusRows] = await Promise.all([
    Blog.find(filter)
      .sort({ updatedAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit)
      .select(LIST_FIELDS)
      .populate('author', ACCOUNT_SUMMARY_FIELDS)
      .lean(),
    Blog.countDocuments(filter),
    Blog.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const counts = Object.fromEntries(
    BLOG_STATUS_VALUES.map((s) => [s, statusRows.find((r) => r._id === s)?.count || 0])
  );
  return { ...buildPage(items, total, paging), counts };
};

const getBlog = async (blogId) => {
  const blog = await findBlog(blogId);
  await blog.populate('author', ACCOUNT_SUMMARY_FIELDS);
  return blog;
};

const applyPublishing = (blog) => {
  if (blog.status === BLOG_STATUS.PUBLISHED && !blog.publishedAt) blog.publishedAt = new Date();
};

const createBlog = async (admin, body) => {
  const data = normalise(body, { creating: true });
  const blog = new Blog({
    ...data,
    slug: await uniqueSlug(data.slug || data.title),
    author: admin.id,
    updatedBy: admin.id,
  });
  applyPublishing(blog);
  await blog.save();
  return getBlog(String(blog._id));
};

const updateBlog = async (admin, blogId, body) => {
  const blog = await findBlog(blogId);
  const data = normalise(body, { creating: false });
  if (data.slug && data.slug !== blog.slug) data.slug = await uniqueSlug(data.slug, blog._id);
  blog.set({ ...data, updatedBy: admin.id });
  applyPublishing(blog);
  await blog.save();
  return getBlog(blogId);
};

/** Cloudinary public id of a cover uploaded through uploadCover, or null for external URLs */
const coverPublicId = (url) => {
  const prefix = `/${cloudinaryFolder}/${COVER_SUBFOLDER}/`;
  if (!url?.includes('res.cloudinary.com') || !url.includes(prefix)) return null;
  const name = url.slice(url.indexOf(prefix) + prefix.length).replace(/\.[a-z0-9]+$/i, '');
  return `${cloudinaryFolder}/${COVER_SUBFOLDER}/${name}`;
};

const deleteBlog = async (blogId) => {
  const blog = await findBlog(blogId);
  const publicId = coverPublicId(blog.coverImageUrl);
  await blog.deleteOne();
  if (publicId && !(await Blog.exists({ coverImageUrl: blog.coverImageUrl }))) {
    await deleteImage(publicId).catch(() => {});
  }
  return { _id: blog._id, title: blog.title };
};

/** Uploads a cover (or in-article) image and returns its URL for the editor to use */
const uploadImageForPost = async (buffer) => {
  const result = await uploadImage(buffer, {
    subfolder: COVER_SUBFOLDER,
    publicId: crypto.randomBytes(10).toString('hex'),
    transformation: COVER_TRANSFORMATION,
  });
  return { url: result.secure_url, width: result.width, height: result.height };
};

// ── Public ───────────────────────────────────────────────────────────────

const PUBLISHED = { status: BLOG_STATUS.PUBLISHED };

/** Published posts. Filters: search, category, featured (true), page, limit */
const listPublishedBlogs = async (query = {}) => {
  const paging = parsePagination(query);
  const filter = listFilter(query, PUBLISHED);
  if (query.featured === 'true') filter.isFeatured = true;

  const [items, total] = await Promise.all([
    Blog.find(filter)
      .sort({ isFeatured: -1, publishedAt: -1 })
      .skip(paging.skip)
      .limit(paging.limit)
      .select(`${LIST_FIELDS} -updatedBy -seo`)
      .populate('author', 'adminProfile.firstName adminProfile.lastName adminProfile.avatarUrl')
      .lean(),
    Blog.countDocuments(filter),
  ]);
  return buildPage(items, total, paging);
};

/** One published post by slug (counts a view) plus up to three related posts */
const getPublishedBlog = async (slug) => {
  if (!isNonEmptyString(slug)) throw new ApiError(400, 'slug is required');
  const blog = await Blog.findOneAndUpdate(
    { slug: slug.toLowerCase(), ...PUBLISHED },
    { $inc: { views: 1 } },
    { new: true }
  )
    .select('-updatedBy')
    .populate('author', 'adminProfile.firstName adminProfile.lastName adminProfile.avatarUrl')
    .lean();
  if (!blog) throw new ApiError(404, 'Blog post not found');

  const related = await Blog.find({
    ...PUBLISHED,
    _id: { $ne: blog._id },
    ...(blog.category ? { category: blog.category } : {}),
  })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select('title slug excerpt coverImageUrl category publishedAt readingMinutes')
    .lean();

  return { blog, related };
};

module.exports = {
  listBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadImageForPost,
  listPublishedBlogs,
  getPublishedBlog,
};
