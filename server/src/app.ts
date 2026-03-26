import env from 'dotenv';
env.config();
import express, { Express } from 'express';
import { configExpress } from './config/express';
import { configMongo } from './config/mongo';

export const initApp = async (): Promise<{ app: Express }> => {
    const app = express();

    configExpress(app);
    await configMongo();

    return { app };
};