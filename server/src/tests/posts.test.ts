import request from 'supertest';
import mongoose from 'mongoose';
import { Express } from 'express';
import { initApp } from '../app';
import { IPost, IUser } from '../types';
import Post from '../models/post';
import User from '../models/user';
import { cleanupAIController } from '../controllers/ai_controller';

let app: Express;
let accessToken = '';

const user: IUser = {
  email: 'test@user.test',
  password: '123456',
  username: 'test',
};

beforeAll(async () => {
  app = (await initApp()).app;
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
  post.user = user._id;
  const response2 = await request(app).post('/auth/login').send({
    identifier: user.email,
    password: user.password
  });
  accessToken = response2.body.accessToken;
});

afterAll(async () => {
  cleanupAIController();
  await mongoose.connection.close();
});

const post: Partial<IPost> = {
  message: 'description1',
  user: user._id,
};

describe('post tests', () => {
  test('TEST POST post', async () => {
    const response = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({
        user: post.user,
        message: post.message
      });
    post._id = response.body._id;

    expect(response.statusCode).toBe(201);
    expect(response.body.user._id).toBe(user._id);
    expect(response.body.message).toBe(post.message);
  });

  test('Test GET posts', async () => {
    const response = await request(app).get('/posts');

    expect(response.statusCode).toBe(200);
    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBe(1);
    expect(response.body.hasMore).toBeDefined();
    expect(response.body.nextCursor).toBeDefined();


    const firstPost = response.body.items[0];
    expect(firstPost.likeCount).toBeDefined();
    expect(firstPost.commentCount).toBeDefined();
    expect(firstPost.likedByMe).toBeDefined();
  });

  test('Test GET post by id', async () => {
    const response = await request(app).get(`/posts/${post._id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.user._id).toBe(user._id);
    expect(response.body.message).toBe(post.message);
  });

  test('TEST GET posts of me', async () => {
    const response = await request(app)
      .get('/posts/user/me')
      .set('Authorization', 'Bearer ' + accessToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBe(1);
    expect(response.body.hasMore).toBeDefined();
    expect(response.body.nextCursor).toBeDefined();
  });

  test('Test PUT post', async () => {
    const response = await request(app)
      .put(`/posts/${post._id}`)
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ message: 'my post' });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('my post');
  });

  test('Test DELETE post', async () => {
    const response = await request(app)
      .delete(`/posts/${post._id}`)
      .set('Authorization', 'Bearer ' + accessToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBeDefined();
  });

  test('Test POST post without auth token', async () => {
    const response = await request(app)
      .post('/posts')
      .send({
        message: 'Unauthorized post'
      });

    expect(response.statusCode).toBe(401);
  });

  test('Test PUT post without auth token', async () => {

    const createResponse = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ message: 'Test post for update' });

    const postId = createResponse.body._id;

    const response = await request(app)
      .put(`/posts/${postId}`)
      .send({ message: 'Updated without auth' });

    expect(response.statusCode).toBe(401);
  });

  test("Test PUT someone else's post", async () => {

    const user2 = {
      email: 'user2@test.com',
      password: '123456',
      username: 'user2'
    };

    await User.deleteMany({ email: user2.email });
    await request(app).post('/auth/register').send(user2);
    const loginResponse = await request(app).post('/auth/login').send({
      identifier: user2.email,
      password: user2.password
    });
    const accessToken2 = loginResponse.body.accessToken;


    const createResponse = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ message: 'First user post' });

    const postId = createResponse.body._id;


    const response = await request(app)
      .put(`/posts/${postId}`)
      .set('Authorization', 'Bearer ' + accessToken2)
      .send({ message: 'Trying to update' });

    expect(response.statusCode).toBe(403);
  });

  test("Test DELETE someone else's post", async () => {

    const user2 = {
      email: 'user2delete@test.com',
      password: '123456',
      username: 'user2delete'
    };

    await User.deleteMany({ email: user2.email });
    await request(app).post('/auth/register').send(user2);
    const loginResponse = await request(app).post('/auth/login').send({
      identifier: user2.email,
      password: user2.password
    });
    const accessToken2 = loginResponse.body.accessToken;


    const createResponse = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ message: 'First user post for delete' });

    const postId = createResponse.body._id;


    const response = await request(app)
      .delete(`/posts/${postId}`)
      .set('Authorization', 'Bearer ' + accessToken2);

    expect(response.statusCode).toBe(403);
  });

  test('Test DELETE post without auth token', async () => {

    const createResponse = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ message: 'Test post for delete without auth' });

    const postId = createResponse.body._id;

    const response = await request(app)
      .delete(`/posts/${postId}`);

    expect(response.statusCode).toBe(401);
  });

  test('Test GET post with invalid ID', async () => {
    const response = await request(app).get('/posts/invalidid123');

    expect(response.statusCode).toBe(400);
  });

  test('Test GET posts by user with filter', async () => {
    const response = await request(app)
      .get('/posts/user/me')
      .set('Authorization', 'Bearer ' + accessToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  test('Test GET posts with query parameter (name filter)', async () => {
    const response = await request(app)
      .get('/posts?name=testname');

    expect(response.statusCode).toBe(200);
    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  test('Test GET posts with populated user data', async () => {

    const createResponse = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ message: 'Post to check population' });

    const postId = createResponse.body._id;

    const response = await request(app).get(`/posts/${postId}`);

    expect(response.statusCode).toBe(200);
    if (response.body.user && typeof response.body.user === 'object') {
      expect(response.body.user.username).toBeDefined();
    }
  });

  test('Test PUT post - ownership check with valid ID but not found', async () => {
    const fakePostId = '507f1f77bcf86cd799439011';
    const response = await request(app)
      .put(`/posts/${fakePostId}`)
      .set('Authorization', 'Bearer ' + accessToken)
      .send({ message: 'Update attempt' });

    expect(response.statusCode).toBe(404);
  });

  test('Test DELETE post - ownership check with valid ID but not found', async () => {
    const fakePostId = '507f1f77bcf86cd799439012';
    const response = await request(app)
      .delete(`/posts/${fakePostId}`)
      .set('Authorization', 'Bearer ' + accessToken);

    expect(response.statusCode).toBe(404);
  });
});
