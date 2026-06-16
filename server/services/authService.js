import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import ApiError from '../utils/ApiError.js';
import { JWT_EXPIRY } from '../utils/constants.js';

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Generate a signed JWT for the given user id.
 * @param {string} userId - Mongoose ObjectId as string.
 * @returns {string} Signed JWT.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
};

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} data
 * @returns {Promise<{ user: object, token: string }>}
 */
const signup = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.badRequest('Email is already registered');
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  // Auto-provision a default workspace for the user
  const workspaceName = `${name}'s Workspace`;
  let slug = slugify(workspaceName);

  // Handle slug collisions
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

  return { user, token };
};

/**
 * Authenticate an existing user.
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ user: object, token: string }>}
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = generateToken(user._id);

  return { user, token };
};

export default { signup, login, generateToken };
