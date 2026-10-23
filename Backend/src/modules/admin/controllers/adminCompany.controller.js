const asyncHandler = require('../../../utils/asyncHandler');
const { getClientInfo } = require('../../../utils/requestInfo');
const adminCompanyService = require('../services/adminCompany.service');

const listCompanies = asyncHandler(async (req, res) => {
  const data = await adminCompanyService.listCompanies(req.query);
  res.status(200).json({ success: true, data });
});

const getCompany = asyncHandler(async (req, res) => {
  const data = await adminCompanyService.getCompany(req.params.companyId);
  res.status(200).json({ success: true, data });
});

const deleteCompany = asyncHandler(async (req, res) => {
  const data = await adminCompanyService.deleteCompany(req.user, req.params.companyId);
  res.status(200).json({ success: true, message: 'Company deleted', data });
});

const updateCompany = asyncHandler(async (req, res) => {
  const company = await adminCompanyService.updateCompany(req.params.companyId, req.body);
  res.status(200).json({ success: true, message: 'Company updated', data: { company } });
});

const impersonateCompany = asyncHandler(async (req, res) => {
  const data = await adminCompanyService.impersonateCompany(
    req.user,
    req.params.companyId,
    getClientInfo(req)
  );
  res.status(200).json({ success: true, data });
});

const listSessions = asyncHandler(async (req, res) => {
  const data = await adminCompanyService.listSessions(req.params.companyId, req.query);
  res.status(200).json({ success: true, data });
});

const listSessionActivities = asyncHandler(async (req, res) => {
  const data = await adminCompanyService.listSessionActivities(
    req.params.companyId,
    req.params.sessionId,
    req.query
  );
  res.status(200).json({ success: true, data });
});

module.exports = {
  listCompanies,
  getCompany,
  deleteCompany,
  updateCompany,
  impersonateCompany,
  listSessions,
  listSessionActivities,
};
