const Department = require('../models/Department');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/roles');

const orgFilter = (user) => {
  if (user.role === ROLES.SUPER_ADMIN) return {};
  return { organization: user.organization };
};

const createDepartment = asyncHandler(async (req, res) => {
  const organization = req.body.organization || req.user.organization;
  if (!organization) throw new ApiError(400, 'Organization is required');

  const dept = await Department.create({ ...req.body, organization });
  const populated = await Department.findById(dept._id)
    .populate('manager', 'employeeId personal')
    .populate('parentDepartment', 'name code');

  res.status(201).json({ success: true, message: 'Department created', data: populated });
});

const getDepartments = asyncHandler(async (req, res) => {
  const filter = { ...orgFilter(req.user) };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.organization && req.user.role === ROLES.SUPER_ADMIN) {
    filter.organization = req.query.organization;
  }

  const departments = await Department.find(filter)
    .populate('manager', 'employeeId personal')
    .populate('parentDepartment', 'name code')
    .sort({ name: 1 });

  res.json({ success: true, data: departments });
});

const getDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id)
    .populate('manager', 'employeeId personal')
    .populate('parentDepartment', 'name code')
    .populate('organization', 'name code');

  if (!dept) throw new ApiError(404, 'Department not found');
  res.json({ success: true, data: dept });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter(req.user) },
    req.body,
    { new: true, runValidators: true }
  )
    .populate('manager', 'employeeId personal')
    .populate('parentDepartment', 'name code');

  if (!dept) throw new ApiError(404, 'Department not found');
  res.json({ success: true, message: 'Department updated', data: dept });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findOneAndDelete({
    _id: req.params.id,
    ...orgFilter(req.user),
  });
  if (!dept) throw new ApiError(404, 'Department not found');
  res.json({ success: true, message: 'Department deleted' });
});

module.exports = {
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
};
