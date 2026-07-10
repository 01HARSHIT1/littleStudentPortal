const Organization = require('../models/Organization');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/roles');

const createOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.create(req.body);
  await AuditLog.create({
    action: 'CREATE',
    user: req.user._id,
    entity: 'Organization',
    entityId: org._id,
    details: { name: org.name },
    ip: req.ip,
  });
  res.status(201).json({ success: true, message: 'Organization created', data: org });
});

const getOrganizations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    filter._id = req.user.organization;
  }
  const orgs = await Organization.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: orgs });
});

const getOrganization = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw new ApiError(404, 'Organization not found');

  if (
    req.user.role !== ROLES.SUPER_ADMIN &&
    String(req.user.organization) !== String(org._id)
  ) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({ success: true, data: org });
});

const updateOrganization = asyncHandler(async (req, res) => {
  if (
    req.user.role !== ROLES.SUPER_ADMIN &&
    String(req.user.organization) !== String(req.params.id)
  ) {
    throw new ApiError(403, 'Access denied');
  }

  const org = await Organization.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!org) throw new ApiError(404, 'Organization not found');

  await AuditLog.create({
    action: 'UPDATE',
    user: req.user._id,
    entity: 'Organization',
    entityId: org._id,
    details: req.body,
    ip: req.ip,
  });

  res.json({ success: true, message: 'Organization updated', data: org });
});

const deleteOrganization = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    throw new ApiError(403, 'Only super admin can delete organizations');
  }
  const org = await Organization.findByIdAndDelete(req.params.id);
  if (!org) throw new ApiError(404, 'Organization not found');
  res.json({ success: true, message: 'Organization deleted' });
});

module.exports = {
  createOrganization,
  getOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
};
