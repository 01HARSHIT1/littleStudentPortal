const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, token missing');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gpro_jwt_secret_change_me');
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('employee', 'employeeId personal professional status');

    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or inactive');
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      throw new ApiError(403, 'Account is temporarily locked');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'Not authorized, token invalid');
  }
});

module.exports = { protect };
