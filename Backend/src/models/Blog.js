const mongoose = require('mongoose');
const {
  BLOG_STATUS,
  BLOG_STATUS_VALUES,
  BLOG_CATEGORIES,
  MAX_BLOG_TAGS,
  MAX_BLOG_EXCERPT,
} = require('../common/contentOptions');

const { ObjectId } = mongoose.Schema.Types;

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true, maxlength: 160 },
    slug: { type: String, trim: true, lowercase: true, required: true, unique: true },
    excerpt: { type: String, trim: true, maxlength: MAX_BLOG_EXCERPT },
    /** Sanitised HTML from the admin editor */
    content: { type: String, default: '' },
    coverImageUrl: { type: String, trim: true },
    category: { type: String, enum: BLOG_CATEGORIES },
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
      default: [],
      validate: {
        validator: (list) => list.length <= MAX_BLOG_TAGS,
        message: `A maximum of ${MAX_BLOG_TAGS} tags is allowed`,
      },
    },
    status: { type: String, enum: BLOG_STATUS_VALUES, default: BLOG_STATUS.DRAFT },
    isFeatured: { type: Boolean, default: false },
    publishedAt: { type: Date },
    readingMinutes: { type: Number, min: 1, default: 1 },
    views: { type: Number, min: 0, default: 0 },
    seo: {
      metaTitle: { type: String, trim: true, maxlength: 70 },
      metaDescription: { type: String, trim: true, maxlength: 160 },
    },
    author: { type: ObjectId, ref: 'User', required: true },
    updatedBy: { type: ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1, status: 1, publishedAt: -1 });

module.exports = mongoose.model('Blog', blogSchema);
