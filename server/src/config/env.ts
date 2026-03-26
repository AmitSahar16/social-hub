const LOCAL_PORT = parseInt(process.env.PORT || '3000');
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || '443');

export const IS_PROD = process.env.NODE_ENV === 'production';

export const PORT = IS_PROD ? HTTPS_PORT : LOCAL_PORT;

export const BASE_URL = IS_PROD
  ? `https://${process.env.DOMAIN}`
  : `http://localhost:${LOCAL_PORT}`;
