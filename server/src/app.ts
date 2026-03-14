import { startServer } from './server';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

const IS_PROD = process.env.NODE_ENV === 'production';
const HTTPS_PORT = process.env.HTTPS_PORT || 443;

export const initApp = async () => {
  try {
    const { app, port } = await startServer();

    if (!IS_PROD) {
      console.log('development mode');

      http.createServer(app).listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log(`Swagger UI available at http://localhost:${port}/api-docs`);
      });
    } else {
      console.log('production mode');

      const options = {
        key: fs.readFileSync(path.join(__dirname, '../cert/client-key.pem')),
        cert: fs.readFileSync(path.join(__dirname, '../cert/client-cert.pem')),
      };

      https.createServer(options, app).listen(HTTPS_PORT, () => {
        console.log(`Server running on port ${HTTPS_PORT}`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

initApp();