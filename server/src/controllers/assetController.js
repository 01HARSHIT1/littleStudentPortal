const Asset = require('../models/Asset');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/roles');

const orgFilter = (user) => {
  if (user.role === ROLES.SUPER_ADMIN) return {};
  return { organization: user.organization };
};

const createAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.create({
    ...req.body,
    organization: req.body.organization || req.user.organization,
    status: req.body.assignedTo ? 'Assigned' : req.body.status || 'Available',
  });
  const populated = await Asset.findById(asset._id).populate(
    'assignedTo',
    'employeeId personal'
  );
  res.status(201).json({ success: true, message: 'Asset created', data: populated });
});

const getAssets = asyncHandler(async (req, res) => {
  const filter = { ...orgFilter(req.user) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

  const assets = await Asset.find(filter)
    .populate('assignedTo', 'employeeId personal')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: assets });
});

const getAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findOne({ _id: req.params.id, ...orgFilter(req.user) }).populate(
    'assignedTo',
    'employeeId personal'
  );
  if (!asset) throw new ApiError(404, 'Asset not found');
  res.json({ success: true, data: asset });
});

const updateAsset = asyncHandler(async (req, res) => {
  if (req.body.assignedTo) req.body.status = 'Assigned';
  if (req.body.assignedTo === null || req.body.assignedTo === '') {
    req.body.assignedTo = null;
    req.body.status = 'Available';
  }

  const asset = await Asset.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter(req.user) },
    req.body,
    { new: true, runValidators: true }
  ).populate('assignedTo', 'employeeId personal');

  if (!asset) throw new ApiError(404, 'Asset not found');
  res.json({ success: true, message: 'Asset updated', data: asset });
});

const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findOneAndDelete({
    _id: req.params.id,
    ...orgFilter(req.user),
  });
  if (!asset) throw new ApiError(404, 'Asset not found');
  res.json({ success: true, message: 'Asset deleted' });
});

const assignAsset = asyncHandler(async (req, res) => {
  const { employeeId } = req.body;
  if (!employeeId) throw new ApiError(400, 'employeeId is required');

  const asset = await Asset.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter(req.user) },
    { assignedTo: employeeId, status: 'Assigned' },
    { new: true }
  ).populate('assignedTo', 'employeeId personal');

  if (!asset) throw new ApiError(404, 'Asset not found');
  res.json({ success: true, message: 'Asset assigned', data: asset });
});

module.exports = {
  createAsset,
  getAssets,
  getAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
};
