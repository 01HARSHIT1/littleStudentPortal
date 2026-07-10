const Designation = require('../models/Designation');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/roles');

const orgFilter = (user) => {
  if (user.role === ROLES.SUPER_ADMIN) return {};
  return { organization: user.organization };
};

const createDesignation = asyncHandler(async (req, res) => {
  const organization = req.body.organization || req.user.organization;
  if (!organization) throw new ApiError(400, 'Organization is required');

  const designation = await Designation.create({ ...req.body, organization });
  const populated = await Designation.findById(designation._id).populate(
    'department',
    'name code'
  );

  res.status(201).json({ success: true, message: 'Designation created', data: populated });
});

const getDesignations = asyncHandler(async (req, res) => {
  const filter = { ...orgFilter(req.user) };
  if (req.query.department) filter.department = req.query.department;

  const designations = await Designation.find(filter)
    .populate('department', 'name code')
    .sort({ level: 1, title: 1 });

  res.json({ success: true, data: designations });
});

const getDesignation = asyncHandler(async (req, res) => {
  const designation = await Designation.findById(req.params.id).populate(
    'department',
    'name code'
  );
  if (!designation) throw new ApiError(404, 'Designation not found');
  res.json({ success: true, data: designation });
});

const updateDesignation = asyncHandler(async (req, res) => {
  const designation = await Designation.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter(req.user) },
    req.body,
    { new: true, runValidators: true }
  ).populate('department', 'name code');

  if (!designation) throw new ApiError(404, 'Designation not found');
  res.json({ success: true, message: 'Designation updated', data: designation });
});

const deleteDesignation = asyncHandler(async (req, res) => {
  const designation = await Designation.findOneAndDelete({
    _id: req.params.id,
    ...orgFilter(req.user),
  });
  if (!designation) throw new ApiError(404, 'Designation not found');
  res.json({ success: true, message: 'Designation deleted' });
});

module.exports = {
  createDesignation,
  getDesignations,
  getDesignation,
  updateDesignation,
  deleteDesignation,
};
