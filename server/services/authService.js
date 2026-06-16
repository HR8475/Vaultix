import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import RefreshToken from '../models/RefreshToken.js';
import ApiError from '../utils/ApiError.js';
import config from '../config/index.js';

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Generate a signed access JWT for the given user id.
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiry,
  });
};

/**
 * Generate a cryptographically secure refresh token.
 */
const generateRefreshTokenString = () => crypto.randomBytes(40).toString('hex');

/**
 * Create a refresh token record in the database.
 */
const createRefreshToken = async (userId, ipAddress, userAgent, family = null) => {
  const tokenString = generateRefreshTokenString();
  const tokenFamily = family || crypto.randomBytes(20).toString('hex');
  
  // Parse expiry from config (e.g. "7d") into Date
  // Defaulting to 7 days if parsing logic is complex; simple fallback logic here
  const daysMatch = config.refreshTokenExpiry.match(/^(\d+)d$/);
  const days = daysMatch ? parseInt(daysMatch[1], 10) : 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const refreshToken = await RefreshToken.create({
    token: tokenString,
    user: userId,
    family: tokenFamily,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return refreshToken.token;
};

/**
 * Register a new user.
 */
const signup = async ({ name, email, password, ipAddress, userAgent }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.badRequest('Email is already registered');
  }

  const user = await User.create({ name, email, password });
  const accessToken = generateAccessToken(user._id);
  const refreshToken = await createRefreshToken(user._id, ipAddress, userAgent);

  // Auto-provision a default workspace for the user
  const workspaceName = `${name}'s Workspace`;
  let slug = slugify(workspaceName);

  const existingWorkspace = await Workspace.findOne({ slug });
  if (existingWorkspace) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  await Workspace.create({
    name: workspaceName,
    slug,
    owner: user._id,
    members: [{ user: user._id, role: 'owner' }],
  });

  return { user, accessToken, refreshToken };
};

/**
 * Authenticate an existing user.
 */
const login = async ({ email, password, ipAddress, userAgent }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = await createRefreshToken(user._id, ipAddress, userAgent);

  return { user, accessToken, refreshToken };
};

/**
 * Refresh tokens with rotation and reuse detection.
 */
const refreshSession = async ({ token, ipAddress, userAgent }) => {
  const existingToken = await RefreshToken.findOne({ token }).populate('user');

  if (!existingToken) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  // Token reuse detection: if the token is already revoked but used again,
  // it means the family is compromised. Revoke the entire family.
  if (existingToken.isRevoked) {
    await RefreshToken.updateMany(
      { family: existingToken.family },
      { $set: { isRevoked: true } }
    );
    throw ApiError.unauthorized('Compromised session detected. Please login again.');
  }

  // Check expiration
  if (existingToken.expiresAt < new Date()) {
    existingToken.isRevoked = true;
    await existingToken.save();
    throw ApiError.unauthorized('Refresh token expired');
  }

  // Rotate token: revoke the old one, issue a new one in the same family
  existingToken.isRevoked = true;
  await existingToken.save();

  const newRefreshTokenString = await createRefreshToken(
    existingToken.user._id,
    ipAddress,
    userAgent,
    existingToken.family
  );
  
  // Link the old token to the new one for tracking
  existingToken.replacedByToken = newRefreshTokenString;
  await existingToken.save();

  const accessToken = generateAccessToken(existingToken.user._id);

  return {
    user: existingToken.user,
    accessToken,
    refreshToken: newRefreshTokenString,
  };
};

/**
 * Revoke a specific refresh token (Logout)
 */
const revokeToken = async (token) => {
  if (!token) return;
  await RefreshToken.findOneAndUpdate(
    { token },
    { $set: { isRevoked: true } }
  );
};

export default { signup, login, refreshSession, revokeToken, generateAccessToken };
