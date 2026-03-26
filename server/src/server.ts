import { initApp } from './app';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { BASE_URL, IS_PROD, PORT } from './config/env';

const SWAGGER_LOG_MESSAGE = `Swagger UI available at ${BASE_URL}/api-docs`;

export const startServer = async () => {
  const { app } = await initApp();

  try {
    if (!IS_PROD) {
      console.log('development mode');

      http.createServer(app).listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(SWAGGER_LOG_MESSAGE);
      });
    } else {
      console.log('production mode');

      const options = {
        key: fs.readFileSync(path.join(__dirname, '../cert/client-key.pem')),
        cert: fs.readFileSync(path.join(__dirname, '../cert/client-cert.pem')),
      };

      https.createServer(options, app).listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(SWAGGER_LOG_MESSAGE);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();