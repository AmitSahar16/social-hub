import { OAuth2Client } from 'google-auth-library';

let googleClient: OAuth2Client = new OAuth2Client();

export const configureOAuth = () => {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BASE_URL || 'http://localhost:3000'}/auth/google/callback`
    );
  }
};

export const getGoogleClient = (): OAuth2Client | null => {
  return googleClient;
};

export const getGoogleAuthUrl = (): string => {
  if (!googleClient) {
    throw new Error('Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  }

  return googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
  });
};

export const verifyGoogleToken = async (code: string) => {
  if (!googleClient) {
    throw new Error('Google OAuth not configured.');
  }

  const { tokens } = await googleClient.getToken(code);
  googleClient.setCredentials(tokens);

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token!,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid token payload');
  }

  return payload;
};
