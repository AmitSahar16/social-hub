import request from 'supertest';
import mongoose from 'mongoose';
import { Express } from 'express';
import { initApp } from '../app';
import User from '../models/user';
import { cleanupAIController } from '../controllers/ai_controller';

let app: Express;

beforeAll(async () => {
  app = (await initApp()).app;
  await User.deleteMany({ email: { $regex: 'oauth-test' } });
});

afterAll(async () => {
  cleanupAIController();
  await mongoose.connection.close();
});

describe('OAuth tests', () => {
  test('Test GET /auth/google - redirects to Google', async () => {
    const response = await request(app)
      .get('/auth/google')
      .redirects(0);


    expect([302, 301]).toContain(response.statusCode);
  });

  test('Test GET /auth/google/callback - fails without code', async () => {
    const response = await request(app)
      .get('/auth/google/callback');


    expect(response.statusCode).not.toBe(200);
  });


  test('Test OAuth user creation - Google ID stored', async () => {

    const testUser = new User({
      email: 'oauth-test-google@test.com',
      username: 'oauthgoogle',
      googleId: 'google-123456',
    });

    await testUser.save();

    const foundUser = await User.findOne({ googleId: 'google-123456' });
    expect(foundUser).toBeDefined();
    expect(foundUser?.email).toBe('oauth-test-google@test.com');
    expect(foundUser?.googleId).toBe('google-123456');

    await User.deleteOne({ _id: foundUser?._id });
  });


  test('Test OAuth user - can login without password', async () => {

    const oauthUser = new User({
      email: 'oauth-no-password@test.com',
      username: 'oauthnopwd',
      googleId: 'google-nopassword-123',
    });

    await oauthUser.save();


    const foundUser = await User.findOne({ googleId: 'google-nopassword-123' });
    expect(foundUser).toBeDefined();
    expect(foundUser?.password).toBeUndefined();


    const response = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'oauth-no-password@test.com',
        password: 'anypassword'
      });

    expect(response.statusCode).not.toBe(200);

    await User.deleteOne({ _id: foundUser?._id });
  });

  test('Test OAuth user search - find by Google ID', async () => {
    const googleUser = new User({
      email: 'oauth-search@test.com',
      username: 'oauthsearch',
      googleId: 'google-search-789',
    });

    await googleUser.save();

    const foundUser = await User.findOne({ googleId: 'google-search-789' });
    expect(foundUser).toBeDefined();
    expect(foundUser?.username).toBe('oauthsearch');

    await User.deleteOne({ _id: foundUser?._id });
  });

  test('Test hybrid user - has both password and Google ID', async () => {

    const response = await request(app)
      .post('/auth/register')
      .send({
        username: 'hybriduser',
        email: 'hybrid-oauth@test.com',
        password: '123456'
      });

    expect(response.statusCode).toBe(201);


    await User.updateOne(
      { email: 'hybrid-oauth@test.com' },
      { $set: { googleId: 'google-hybrid-999' } }
    );

    const user = await User.findOne({ email: 'hybrid-oauth@test.com' });
    expect(user?.password).toBeDefined();
    expect(user?.googleId).toBe('google-hybrid-999');


    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'hybrid-oauth@test.com',
        password: '123456'
      });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.accessToken).toBeDefined();

    await User.deleteOne({ _id: user?._id });
  });

  test('Test OAuth profile with profileImage', async () => {

    const oauthUser = new User({
      email: 'oauth-profile@test.com',
      username: 'oauthprofile',
      googleId: 'google-profile-111',
      profileImage: 'https://example.com/profile.jpg',
    });

    await oauthUser.save();

    const foundUser = await User.findOne({ googleId: 'google-profile-111' });
    expect(foundUser).toBeDefined();
    expect(foundUser?.profileImage).toBe('https://example.com/profile.jpg');

    await User.deleteOne({ _id: foundUser?._id });
  });

  test('Test GET /auth/google - endpoint exists and is accessible', async () => {
    const response = await request(app).get('/auth/google');


    expect(response.statusCode).not.toBe(404);
  });
});
