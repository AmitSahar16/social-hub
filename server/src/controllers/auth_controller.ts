import { Request, Response } from 'express';
import User from '../models/user';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, getRefreshTokenFromHeader, verifyRefreshToken } from '../utils/authUtils';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    throw new AppError(400, 'Missing required fields: email, password, username', 'MISSING_FIELDS');
  }

  const existingUser = await User.findOne({ email: email });

  if (existingUser) {
    throw new AppError(409, 'Email already exists', 'EMAIL_EXISTS');
  }

  const salt = await bcrypt.genSalt(10);
  const encryptedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    email: email,
    password: encryptedPassword,
    username: username,
  });

  return res.status(201).json({
    _id: user._id,
    email: user.email,
    username: user.username,
  });
});

const login = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw new AppError(400, 'Missing identifier or password', 'MISSING_FIELDS');
  }

  const isEmail = identifier.includes('@');
  const query = isEmail ? { email: identifier } : { username: identifier };

  const user = await User.findOne(query);

  if (!user) {
    throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  if (user.createdViaGoogle) {
    throw new AppError(401, 'This account was created with Google. Please sign in with Google instead.', 'USE_GOOGLE_LOGIN');
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const accessToken = generateAccessToken({ _id: user._id });
  const refreshToken = generateRefreshToken({ _id: user._id });

  user.refreshTokens = [refreshToken];
  await user.save();

  return res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      username: user.username,
      profileImage: user.profileImage,
    },
    accessToken,
    refreshToken,
  });
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = getRefreshTokenFromHeader(req.headers);

  if (!refreshToken) {
    throw new AppError(401, 'No refresh token provided', 'MISSING_TOKEN');
  }

  const tokenPayload = verifyRefreshToken(refreshToken);
  const user = await User.findOne(tokenPayload);

  if (!user) {
    throw new AppError(401, 'User not found', 'USER_NOT_FOUND');
  }

  if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
    user.refreshTokens = [];
    await user.save();
    throw new AppError(401, 'Invalid refresh token', 'INVALID_TOKEN');
  }

  user.refreshTokens = user.refreshTokens.filter(
    (token) => token !== refreshToken
  );

  await user.save();
  return res.sendStatus(200);
});

const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = getRefreshTokenFromHeader(req.headers);

  if (!refreshToken) {
    throw new AppError(401, 'No refresh token provided', 'MISSING_TOKEN');
  }

  const tokenPayload = verifyRefreshToken(refreshToken);
  const user = await User.findById(tokenPayload._id);

  if (!user) {
    throw new AppError(401, 'User not found', 'USER_NOT_FOUND');
  }

  if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
    user.refreshTokens = [];
    await user.save();
    throw new AppError(401, 'Invalid refresh token', 'INVALID_TOKEN');
  }

  const payload = { _id: tokenPayload._id };
  const accessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  user.refreshTokens = user.refreshTokens.filter(
    (token) => token !== refreshToken
  );

  user.refreshTokens.push(newRefreshToken);
  await user.save();

  return res.status(200).json({
    accessToken: accessToken,
    refreshToken: newRefreshToken,
  });
});

export default {
  register,
  login,
  logout,
  refresh,
};
