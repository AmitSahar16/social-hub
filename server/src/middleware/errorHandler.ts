import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code || 'ERROR',
      message: err.message,
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: err.message,
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      code: 'INVALID_ID',
      message: 'Invalid ID format',
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      code: 'INVALID_TOKEN',
      message: 'Invalid or expired token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      code: 'TOKEN_EXPIRED',
      message: 'Token has expired',
    });
  }

  console.error('Unhandled error:', err);

  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
