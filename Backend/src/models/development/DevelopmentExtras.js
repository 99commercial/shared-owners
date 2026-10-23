const mongoose = require('mongoose');
const { tabBaseFields } = require('../shared');

/** Whole tab is for premium (Featured Developer Package) only, enforced in the service */
const developmentExtrasSchema = new mongoose.Schema(
  {
    ...tabBaseFields('development', 'Development'),

    /** Short description shown on the Developer Page */
    summaryText: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DevelopmentExtras', developmentExtrasSchema);
