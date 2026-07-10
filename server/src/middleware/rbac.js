const ApiError = require('../utils/ApiError');
const { hasPermission } = require('../config/roles');

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authenticated'));
  }

  if (roles.length && !roles.includes(req.user.role)) {
    return next(new ApiError(403, `Role ${req.user.role} is not authorized for this action`));
  }

  next();
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authenticated'));
  }

  if (!hasPermission(req.user.role, permission)) {
    return next(new ApiError(403, 'Insufficient permissions'));
  }

  next();
};

module.exports = { authorize, requirePermission };
