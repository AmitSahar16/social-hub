import { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from '../routes';
import { configSwagger } from './swagger';
import { errorHandler } from '../middleware/errorHandler';
import { configureOAuth } from '../utils/googleAuthUtils';
import express from 'express';
import path from 'path';

const FRONTEND_FOLDER_NAME = process.env.FRONTEND_FOLDER_NAME || 'client';
const FRONTEND_FOLDER_PATH = path.join(__dirname, `../../../../${FRONTEND_FOLDER_NAME}/dist`);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const configExpress = (app: Express) => {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
      },
    },
  }));

  app.use(cors());
  app.use(limiter);

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  configureOAuth();

  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

  app.use(express.static(FRONTEND_FOLDER_PATH));

  app.use('/', routes);

  configSwagger(app);

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(FRONTEND_FOLDER_PATH, "index.html"));
  });

  app.use(errorHandler);
};