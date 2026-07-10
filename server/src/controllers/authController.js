const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { generateTokens, generateAccessToken } = require('../utils/generateTokens');
const { validatePassword } = require('../utils/passwordValidator');
const { createNotification, sendEmail } = require('../services/notificationService');
const jwt = require('jsonwebtoken');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password +refreshToken')
    .populate('employee', 'employeeId personal professional status')
    .populate('organization', 'name code');

  if (!user) throw new ApiError(401, 'Invalid credentials');

  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new ApiError(403, 'Account locked due to too many failed attempts. Try again later.');
  }

  if (!user.isActive) throw new ApiError(403, 'Account is deactivated');

  const match = await user.comparePassword(password);
  if (!match) {
    await user.incLoginAttempts();
    throw new ApiError(401, 'Invalid credentials');
  }

  await user.resetLoginAttempts();
  const tokens = generateTokens(user);
  user.refreshToken = tokens.refreshToken;
  user.lastLogin = new Date();
  await user.save();

  await AuditLog.create({
    action: 'LOGIN',
    user: user._id,
    entity: 'User',
    entityId: user._id,
    ip: req.ip,
  });

  res.cookie('accessToken', tokens.accessToken, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 });
  res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

  const userData = user.toObject();
  delete userData.password;
  delete userData.refreshToken;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userData,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    await AuditLog.create({
      action: 'LOGOUT',
      user: req.user._id,
      entity: 'User',
      entityId: req.user._id,
      ip: req.ip,
    });
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'Refresh token required');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'gpro_refresh_secret_change_me');
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== token) {
    throw new ApiError(401, 'Refresh token invalid or revoked');
  }

  const accessToken = generateAccessToken(user);
  res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 });

  res.json({
    success: true,
    message: 'Token refreshed',
    data: { accessToken },
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: 'GPro Password Reset',
    text: `Reset your password using this link (valid 1 hour): ${resetUrl}`,
    html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  res.json({
    success: true,
    message: 'If that email exists, a reset link has been sent',
    data: process.env.NODE_ENV !== 'production' ? { resetToken } : undefined,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new ApiError(400, 'Token and password are required');

  const check = validatePassword(password);
  if (!check.valid) throw new ApiError(400, check.message);

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpire');

  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful' });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current and new password are required');
  }

  const check = validatePassword(newPassword);
  if (!check.valid) throw new ApiError(400, check.message);

  const user = await User.findById(req.user._id).select('+password');
  const match = await user.comparePassword(currentPassword);
  if (!match) throw new ApiError(400, 'Current password is incorrect');

  user.password = newPassword;
  await user.save();

  await createNotification({
    userId: user._id,
    title: 'Password changed',
    message: 'Your password was changed successfully.',
    type: 'system',
    io: req.app.get('io'),
  }).catch(() => {});

  res.json({ success: true, message: 'Password changed successfully' });
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('employee')
    .populate('organization', 'name code address logo settings');

  res.json({ success: true, data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['email'];
  const updates = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  if (updates.email) updates.email = updates.email.toLowerCase();

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('employee')
    .populate('organization', 'name code');

  res.json({ success: true, message: 'Profile updated', data: user });
});

module.exports = {
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
};
