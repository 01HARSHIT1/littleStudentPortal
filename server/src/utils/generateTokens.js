const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      organization: user.organization,
      email: user.email,
    },
    process.env.JWT_SECRET || 'gpro_jwt_secret_change_me',
    { expiresIn: process.env.JWT_EXPIRE || '1d' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'gpro_refresh_secret_change_me',
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

const generateTokens = (user) => ({
  accessToken: generateAccessToken(user),
  refreshToken: generateRefreshToken(user),
});

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
};
