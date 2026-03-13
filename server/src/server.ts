import express, { Express } from 'express';

export const startServer = async (): Promise<{ app: Express, port: number }> => {
    const app = express();
    const port = parseInt(process.env.PORT || '3000');

    return { app, port };
};