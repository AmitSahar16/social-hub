import { Request, Response } from 'express';
import User from '../models/user';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken, getRefreshTokenFromHeader, verifyRefreshToken } from '../utils/authUtils';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getGoogleAuthUrl, verifyGoogleToken } from '../utils/googleAuthUtils';
import { BASE_URL } from '../config/env';

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

const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  try {
    const authUrl = getGoogleAuthUrl();
    res.redirect(authUrl);
  } catch (error: any) {
    throw new AppError(501, error.message, 'OAUTH_NOT_CONFIGURED');
  }
});

const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    throw new AppError(400, 'Authorization code missing', 'MISSING_CODE');
  }

  const frontendUrl = BASE_URL;

  try {
    const payload = await verifyGoogleToken(code);

    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.findOne({ email: payload.email });

      if (user) {
        user.googleId = payload.sub;
        await user.save();
      } else {
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        user = await User.create({
          googleId: payload.sub,
          email: payload.email || `${payload.sub}@google.com`,
          username: payload.name || `google_${payload.sub}`,
          password: hashedPassword,
          profileImage: payload.picture,
          createdViaGoogle: true,
        });
      }
    }

    const accessToken = generateAccessToken({ _id: user._id });
    const refreshToken = generateRefreshToken({ _id: user._id });

    user.refreshTokens = [refreshToken];
    await user.save();

    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    res.redirect(redirectUrl);
  } catch (error: any) {
    const errorUrl = `${frontendUrl}/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`;
    res.redirect(errorUrl);
  }
});

const googleFailure = asyncHandler(async (req: Request, res: Response) => {
  res.status(401).json({
    code: 'OAUTH_FAILURE',
    message: 'Google authentication failed',
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
  googleAuth,
  googleCallback,
  googleFailure,
  logout,
  refresh,
};
