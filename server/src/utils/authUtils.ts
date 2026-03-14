import jwt from 'jsonwebtoken';
import { ITokenPayload } from '../types';

export const generateAccessToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || '15m') as any
  });
};

export const generateRefreshToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || '7d') as any
  });
};

export const verifyAccessToken = (token: string): ITokenPayload => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as ITokenPayload;
};

export const verifyRefreshToken = (token: string): ITokenPayload => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as ITokenPayload;
};

export const getRefreshTokenFromHeader = (headers) => {
  const authHeader = headers['authorization'];
  const refreshToken = authHeader && authHeader.split(' ')[1];

  if (!refreshToken) {
    console.error("user didn't add refresh token to the request");
    return null;
  }

  return refreshToken;
};

