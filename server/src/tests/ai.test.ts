import request from 'supertest';
import mongoose from 'mongoose';
import { Express } from 'express';
import { startServer } from '../server';
import { IPost, IUser } from '../types';
import Post from '../models/post';
import User from '../models/user';
import { aiRateLimiter } from '../controllers/ai_controller';

let app: Express;
let accessToken = '';

const user: IUser = {
  email: 'ai-test@user.test',
  password: '123456',
  username: 'aitest',
};

beforeAll(async () => {

  process.env.AI_PROVIDER = 'mock';

  app = (await startServer()).app;
  await Post.deleteMany();


  await User.deleteMany({ email: user.email });
  const response = await request(app)
    .post('/auth/register')
    .send({
      username: user.username,
      email: user.email,
      password: user.password
    });

  user._id = response.body._id;

  const loginResponse = await request(app).post('/auth/login').send({
    identifier: user.email,
    password: user.password
  });
  accessToken = loginResponse.body.accessToken;


  await request(app)
    .post('/posts')
    .set('Authorization', 'Bearer ' + accessToken)
    .send({ message: 'JavaScript tutorial for beginners' });

  await request(app)
    .post('/posts')
    .set('Authorization', 'Bearer ' + accessToken)
    .send({ message: 'Python machine learning guide' });

  await request(app)
    .post('/posts')
    .set('Authorization', 'Bearer ' + accessToken)
    .send({ message: 'TypeScript best practices' });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(() => {
  aiRateLimiter.reset(user._id?.toString());
});

describe('AI Search tests', () => {
  test('Test POST /ai/search - basic search with keywords', async () => {
    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: 'Find posts about JavaScript' });

    expect(response.statusCode).toBe(200);
    expect(response.body.results).toBeDefined();
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.explanation).toBeDefined();
    expect(response.body.cached).toBe(false);
  });

  test('Test POST /ai/search - cached result for same query', async () => {

    await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: 'posts about Python' });


    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: 'posts about Python' });

    expect(response.statusCode).toBe(200);
    expect(response.body.results).toBeDefined();
    expect(response.body.cached).toBe(true);
  });

  test('Test POST /ai/search - case and whitespace normalization', async () => {

    await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: 'typescript posts' });


    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: '  TypeScript   Posts  ' });

    expect(response.statusCode).toBe(200);
    expect(response.body.cached).toBe(true);
  });

  test('Test POST /ai/search - search by author', async () => {
    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: `Show me posts by ${user.username}` });

    expect(response.statusCode).toBe(200);
    expect(response.body.results).toBeDefined();


    response.body.results.forEach((post: any) => {
      expect(post.user.username).toBe(user.username);
    });
  });

  test('Test POST /ai/search - keyword extraction', async () => {
    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: 'Find tutorials about programming languages' });

    expect(response.statusCode).toBe(200);
    expect(response.body.results).toBeDefined();
    expect(response.body.explanation).toContain('keywords');
  });

  test('Test POST /ai/search - empty results', async () => {
    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: 'Find posts about quantum physics' });

    expect(response.statusCode).toBe(200);
    expect(response.body.results).toBeDefined();
    expect(Array.isArray(response.body.results)).toBe(true);

  });

  test('Test POST /ai/search - unauthorized (no token)', async () => {
    const response = await request(app)
      .post('/ai/search')
      .send({ query: 'Test query' });

    expect(response.statusCode).toBe(401);
  });

  test('Test POST /ai/search - missing query', async () => {
    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({});

    expect(response.statusCode).toBe(400);
  });

  test('Test POST /ai/search - empty query', async () => {
    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: '' });

    expect(response.statusCode).toBe(400);
  });

  test('Test POST /ai/search - rate limiting', async () => {

    for (let i = 0; i < 10; i++) {
      const response = await request(app)
        .post('/ai/search')
        .set('Authorization', 'Bearer ' + accessToken)
        .send({ query: `Unique query number ${i} ${Date.now()}` });

      expect(response.statusCode).toBe(200);
    }


    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: `11th unique query ${Date.now()}` });

    expect(response.statusCode).toBe(429);
    expect(response.body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(response.body.message).toContain('rate limit');
  });

  test('Test POST /ai/search - results have enriched metadata', async () => {
    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: 'Find all posts' });

    expect(response.statusCode).toBe(200);

    if (response.body.results.length > 0) {
      const firstResult = response.body.results[0];
      expect(firstResult.user).toBeDefined();
      expect(firstResult.user.username).toBeDefined();
      expect(firstResult.message).toBeDefined();
      expect(firstResult.createdAt).toBeDefined();
    }
  });

  test('Test POST /ai/search - explanation format', async () => {
    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: 'Show me JavaScript posts' });

    expect(response.statusCode).toBe(200);
    expect(response.body.explanation).toBeDefined();
    expect(typeof response.body.explanation).toBe('string');
    expect(response.body.explanation.length).toBeGreaterThan(0);
  });

  test('Test POST /ai/search - results are sorted by date (newest first)', async () => {
    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: 'Find all programming posts' });

    expect(response.statusCode).toBe(200);

    if (response.body.results.length > 1) {
      const firstDate = new Date(response.body.results[0].createdAt);
      const secondDate = new Date(response.body.results[1].createdAt);


      expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
    }
  });

  test('Test POST /ai/search - max 20 results', async () => {

    for (let i = 0; i < 25; i++) {
      await request(app)
        .post('/posts')
        .set('Authorization', 'Bearer ' + accessToken)
        .send({ message: `Test post ${i}` });
    }

    const response = await request(app)
      .post('/ai/search')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ query: 'Find test posts' });

    expect(response.statusCode).toBe(200);
    expect(response.body.results.length).toBeLessThanOrEqual(20);
  });
});
