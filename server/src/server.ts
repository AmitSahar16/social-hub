import express, { Express } from 'express';
import { configExpress } from './config/express';
import { configMongo } from './config/mongo';

export const startServer = async (): Promise<{ app: Express, port: number }> => {
    const app = express();
    const port = parseInt(process.env.PORT || '3000');

    configExpress(app, port);
    await configMongo();

    return { app, port };
};