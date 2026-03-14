import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import { verifyAccessToken } from '../utils/authUtils';
import { AppError } from './errorHandler';

const authMiddleware = (req: IAuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError(401, 'No token provided', 'MISSING_TOKEN');
    }

    const decoded = verifyAccessToken(token);
    req.user = { _id: decoded._id };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');
  }
};

export default authMiddleware;

