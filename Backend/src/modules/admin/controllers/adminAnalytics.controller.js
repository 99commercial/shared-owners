const asyncHandler = require('../../../utils/asyncHandler');
const adminAnalyticsService = require('../services/adminAnalytics.service');

/** GET /api/admin/analytics/accounts?days=7|30|90|365 */
const getAccountAnalytics = asyncHandler(async (req, res) => {
  const data = await adminAnalyticsService.getAccountAnalytics(req.query);
  res.status(200).json({ success: true, data });
});

/** GET /api/admin/analytics/properties?days= */
const getPropertyAnalytics = asyncHandler(async (req, res) => {
  const data = await adminAnalyticsService.getPropertyAnalytics(req.query);
  res.status(200).json({ success: true, data });
});

/** GET /api/admin/analytics/developments?days= */
const getDevelopmentAnalytics = asyncHandler(async (req, res) => {
  const data = await adminAnalyticsService.getDevelopmentAnalytics(req.query);
  res.status(200).json({ success: true, data });
});

module.exports = { getAccountAnalytics, getPropertyAnalytics, getDevelopmentAnalytics };
