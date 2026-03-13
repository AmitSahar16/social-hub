import { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '../middleware/errorHandler';
import express from 'express';
import path from 'path';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const configExpress = (app: Express, port: number) => {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  app.use(cors());
  app.use(limiter);

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  app.use(errorHandler);
};