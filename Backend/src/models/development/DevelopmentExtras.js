const mongoose = require('mongoose');
const { tabBaseFields } = require('../shared');

/** Optional extras shown on the Developer Page */
const developmentExtrasSchema = new mongoose.Schema(
  {
    ...tabBaseFields('development', 'Development'),

    /** Short description shown on the Developer Page */
    summaryText: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DevelopmentExtras', developmentExtrasSchema);
