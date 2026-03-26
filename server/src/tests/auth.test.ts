import request from 'supertest';
import mongoose from 'mongoose';
import { Express } from 'express';
import { initApp } from '../app';
import User from '../models/user';
import { IUser } from '../types';
import { cleanupAIController } from '../controllers/ai_controller';

let app: Express;

const user: IUser = {
  email: 'test@user.test',
  password: '123456',
  username: 'test',
};

beforeAll(async () => {
  process.env.ACCESS_TOKEN_EXPIRY = '3s';
  app = (await initApp()).app;
  await User.deleteMany({ email: user.email });
  await User.deleteMany({ email: user.email + '1' });
});

afterAll(async () => {
  cleanupAIController();
  await mongoose.connection.close();
});

let accessToken: string;
let refreshToken: string;
let newRefreshToken: string;

describe('Auth tests', () => {
  test('Test Register', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        username: user.username,
        email: user.email,
        password: user.password
      });

    expect(response.statusCode).toBe(201);
  });

  test('Test Register exist email', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        username: user.username,
        email: user.email,
        password: user.password
      });

    expect(response.statusCode).toBe(409);
  });

  test('Test Register missing password', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        username: user.username,
        email: user.email
      });

    expect(response.statusCode).toBe(400);
  });

  test('Test Login', async () => {
    const response = await request(app).post('/auth/login').send({
      identifier: user.email,
      password: user.password
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user._id).toBeDefined();
    expect(response.body.user.email).toBe(user.email);

    accessToken = response.body.accessToken;
    refreshToken = response.body.refreshToken;

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
  });

  test('Test forbidden access without token', async () => {
    const response = await request(app).get('/users/me');

    expect(response.statusCode).toBe(401);
  });

  test('Test access with valid token', async () => {
    const response = await request(app)
      .get('/users/me')
      .set('Authorization', 'Bearer ' + accessToken);

    expect(response.statusCode).toBe(200);
  });

  test('Test access with invalid token', async () => {
    const response = await request(app)
      .get('/users/me')
      .set('Authorization', 'Bearer 1' + accessToken);

    expect(response.statusCode).toBe(401);
  });

  test('Test access after timeout of token', async () => {
    await new Promise((resolve) => setTimeout(() => resolve('done'), 4000));

    const response = await request(app)
      .get('/users/me')
      .set('Authorization', 'Bearer ' + accessToken);

    expect(response.statusCode).toBe(401);
  });

  test('Test refresh token', async () => {

    const loginResponse = await request(app).post('/auth/login').send({
      identifier: user.email,
      password: user.password
    });
    const freshRefreshToken = loginResponse.body.refreshToken;

    const response = await request(app)
      .get('/auth/refresh')
      .set('Authorization', 'Bearer ' + freshRefreshToken)
      .send();

    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();

    const newAccessToken = response.body.accessToken;
    newRefreshToken = response.body.refreshToken;

    const response2 = await request(app)
      .get('/users/me')
      .set('Authorization', 'Bearer ' + newAccessToken);

    expect(response2.statusCode).toBe(200);
  });

  test('Test double use of refresh token', async () => {
    const response = await request(app)
      .get('/auth/refresh')
      .set('Authorization', 'Bearer ' + refreshToken)
      .send();

    expect(response.statusCode).not.toBe(200);

    const response1 = await request(app)
      .get('/auth/refresh')
      .set('Authorization', 'Bearer ' + newRefreshToken)
      .send();

    expect(response1.statusCode).not.toBe(200);
  });

  test('Test login missing password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        identifier: user.email
      });

    expect(response.statusCode).toBe(400);
  });

  test('Test login missing identifier', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        password: user.password
      });

    expect(response.statusCode).toBe(400);
  });

  test('Test login with wrong password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        identifier: user.email,
        password: 'wrongpassword'
      });

    expect(response.statusCode).toBe(401);
  });

  test('Test login with non-existent email', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        identifier: 'nonexistent@email.com',
        password: user.password
      });

    expect(response.statusCode).toBe(401);
  });

  test('Test login with username', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        identifier: user.username,
        password: user.password
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
  });

  test('Test logout without refresh token', async () => {
    const response = await request(app)
      .get('/auth/logout')
      .send();

    expect(response.statusCode).toBe(401);
  });

  test('Test refresh without token', async () => {
    const response = await request(app)
      .get('/auth/refresh')
      .send();

    expect(response.statusCode).toBe(401);
  });

  test('Test refresh with invalid token', async () => {
    const response = await request(app)
      .get('/auth/refresh')
      .set('Authorization', 'Bearer invalidtoken123')
      .send();

    expect(response.statusCode).toBe(401);
  });

  test('Test register missing username', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'newuser@test.com',
        password: '123456'
      });

    expect(response.statusCode).toBe(400);
  });

  test('Test register missing email', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        username: 'newuser',
        password: '123456'
      });

    expect(response.statusCode).toBe(400);
  });

  test('Test logout with already used token', async () => {
    const loginResponse = await request(app).post('/auth/login').send({
      identifier: user.email,
      password: user.password
    });
    const validRefreshToken = loginResponse.body.refreshToken;


    await request(app)
      .get('/auth/logout')
      .set('Authorization', 'Bearer ' + validRefreshToken)
      .send();


    const response = await request(app)
      .get('/auth/logout')
      .set('Authorization', 'Bearer ' + validRefreshToken)
      .send();

    expect(response.statusCode).toBe(401);
  });

  test('Test refresh with token from non-existent user', async () => {


    const response = await request(app)
      .get('/auth/refresh')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid')
      .send();

    expect(response.statusCode).toBe(401);
  });

  test('Test logout with token for deleted user', async () => {
    const tempUser = {
      email: 'temp@test.com',
      password: '123456',
      username: 'temp'
    };
    await User.deleteMany({ email: tempUser.email });
    await request(app).post('/auth/register').send(tempUser);
    const loginResp = await request(app).post('/auth/login').send({
      identifier: tempUser.email,
      password: tempUser.password
    });
    const token = loginResp.body.refreshToken;
    await User.deleteMany({ email: tempUser.email });

    const response = await request(app)
      .get('/auth/logout')
      .set('Authorization', 'Bearer ' + token)
      .send();

    expect(response.statusCode).toBe(401);
  });

  test('Test refresh with token for deleted user', async () => {
    const tempUser = {
      email: 'temp2@test.com',
      password: '123456',
      username: 'temp2'
    };
    await User.deleteMany({ email: tempUser.email });
    await request(app).post('/auth/register').send(tempUser);
    const loginResp = await request(app).post('/auth/login').send({
      identifier: tempUser.email,
      password: tempUser.password
    });
    const token = loginResp.body.refreshToken;
    await User.deleteMany({ email: tempUser.email });

    const response = await request(app)
      .get('/auth/refresh')
      .set('Authorization', 'Bearer ' + token)
      .send();

    expect(response.statusCode).toBe(401);
  });
});
