const Document = require('../models/Document');
const cloudinary = require('cloudinary').v2;
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/roles');

const configureCloudinary = () => {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return true;
  }
  return false;
};

const uploadToCloudinary = (buffer, folder = 'gpro') =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

const orgFilter = (user) => {
  if (user.role === ROLES.SUPER_ADMIN) return {};
  return { organization: user.organization };
};

const createDocument = asyncHandler(async (req, res) => {
  let fileUrl = req.body.fileUrl;
  let fileName = req.body.fileName;
  let mimeType = req.body.mimeType;
  let size = req.body.size;

  if (req.file) {
    fileName = req.file.originalname;
    mimeType = req.file.mimetype;
    size = req.file.size;

    if (configureCloudinary()) {
      const result = await uploadToCloudinary(req.file.buffer);
      fileUrl = result.secure_url;
    } else {
      fileUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64').slice(0, 100)}...local`;
      // pragmatic fallback for academic project without Cloudinary
      fileUrl = `local://${req.file.originalname}`;
    }
  }

  if (!fileUrl) throw new ApiError(400, 'fileUrl or file upload is required');
  if (!req.body.title) throw new ApiError(400, 'title is required');

  const doc = await Document.create({
    title: req.body.title,
    category: req.body.category || 'Other',
    fileUrl,
    fileName,
    mimeType,
    size,
    uploadedBy: req.user._id,
    employee: req.body.employee,
    organization: req.user.organization,
    accessRoles: req.body.accessRoles
      ? Array.isArray(req.body.accessRoles)
        ? req.body.accessRoles
        : String(req.body.accessRoles).split(',')
      : [],
  });

  const populated = await Document.findById(doc._id)
    .populate('uploadedBy', 'email role')
    .populate('employee', 'employeeId personal');

  res.status(201).json({ success: true, message: 'Document uploaded', data: populated });
});

const getDocuments = asyncHandler(async (req, res) => {
  const filter = { ...orgFilter(req.user) };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.employee) filter.employee = req.query.employee;

  // role-based access: if accessRoles set, user role must be included (or uploader/admin)
  const docs = await Document.find(filter)
    .populate('uploadedBy', 'email role')
    .populate('employee', 'employeeId personal')
    .sort({ createdAt: -1 });

  const filtered = docs.filter((d) => {
    if (!d.accessRoles || d.accessRoles.length === 0) return true;
    if (
      [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.HR_MANAGER].includes(req.user.role)
    ) {
      return true;
    }
    if (String(d.uploadedBy?._id || d.uploadedBy) === String(req.user._id)) return true;
    return d.accessRoles.includes(req.user.role);
  });

  res.json({ success: true, data: filtered });
});

const getDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id)
    .populate('uploadedBy', 'email role')
    .populate('employee', 'employeeId personal');
  if (!doc) throw new ApiError(404, 'Document not found');
  res.json({ success: true, data: doc });
});

const updateDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findOneAndUpdate(
    { _id: req.params.id, ...orgFilter(req.user) },
    req.body,
    { new: true, runValidators: true }
  )
    .populate('uploadedBy', 'email role')
    .populate('employee', 'employeeId personal');

  if (!doc) throw new ApiError(404, 'Document not found');
  res.json({ success: true, message: 'Document updated', data: doc });
});

const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findOneAndDelete({
    _id: req.params.id,
    ...orgFilter(req.user),
  });
  if (!doc) throw new ApiError(404, 'Document not found');
  res.json({ success: true, message: 'Document deleted' });
});

module.exports = {
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
};
