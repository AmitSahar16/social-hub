import request from 'supertest';
import mongoose from 'mongoose';
import { Express } from 'express';
import { startServer } from '../server';
import { IPost, IUser } from '../types';
import Post from '../models/post';
import User from '../models/user';
import Like from '../models/like';

let app: Express;
let accessToken1 = '';
let accessToken2 = '';

const user1: IUser = {
  email: 'like-test1@user.test',
  password: '123456',
  username: 'liketest1',
};

const user2: IUser = {
  email: 'like-test2@user.test',
  password: '123456',
  username: 'liketest2',
};

beforeAll(async () => {
  app = (await startServer()).app;
  await Like.deleteMany();
  await Post.deleteMany();


  await User.deleteMany({ email: user1.email });
  const response1 = await request(app)
    .post('/auth/register')
    .send({
      username: user1.username,
      email: user1.email,
      password: user1.password
    });

  user1._id = response1.body._id;

  const loginResponse1 = await request(app).post('/auth/login').send({
    identifier: user1.email,
    password: user1.password
  });
  accessToken1 = loginResponse1.body.accessToken;


  await User.deleteMany({ email: user2.email });
  const response2 = await request(app)
    .post('/auth/register')
    .send({
      username: user2.username,
      email: user2.email,
      password: user2.password
    });

  user2._id = response2.body._id;

  const loginResponse2 = await request(app).post('/auth/login').send({
    identifier: user2.email,
    password: user2.password
  });
  accessToken2 = loginResponse2.body.accessToken;


  const postResponse = await request(app)
    .post('/posts')
    .set('Authorization', 'Bearer ' + accessToken1)
    .send({ message: 'Test post for likes' });

  post._id = postResponse.body._id;
});

afterAll(async () => {
  await mongoose.connection.close();
});

const post: Partial<IPost> = {
  message: 'Test post for likes',
};

describe('Likes tests', () => {
  test('Test POST /posts/:id/like - like a post', async () => {
    const response = await request(app)
      .post(`/posts/${post._id}/like`)
      .set('Authorization', 'Bearer ' + accessToken1);

    expect(response.statusCode).toBe(200);
    expect(response.body.liked).toBe(true);
    expect(response.body.likeCount).toBe(1);
  });

  test('Test POST /posts/:id/like - unlike a post (toggle)', async () => {
    const response = await request(app)
      .post(`/posts/${post._id}/like`)
      .set('Authorization', 'Bearer ' + accessToken1);

    expect(response.statusCode).toBe(200);
    expect(response.body.liked).toBe(false);
    expect(response.body.likeCount).toBe(0);
  });

  test('Test POST /posts/:id/like - like again after unlike', async () => {
    const response = await request(app)
      .post(`/posts/${post._id}/like`)
      .set('Authorization', 'Bearer ' + accessToken1);

    expect(response.statusCode).toBe(200);
    expect(response.body.liked).toBe(true);
    expect(response.body.likeCount).toBe(1);
  });

  test('Test POST /posts/:id/like - second user likes the same post', async () => {
    const response = await request(app)
      .post(`/posts/${post._id}/like`)
      .set('Authorization', 'Bearer ' + accessToken2);

    expect(response.statusCode).toBe(200);
    expect(response.body.liked).toBe(true);
    expect(response.body.likeCount).toBe(2);
  });

  test('Test GET /posts - verify likeCount in feed', async () => {
    const response = await request(app)
      .get('/posts')
      .set('Authorization', 'Bearer ' + accessToken1);

    expect(response.statusCode).toBe(200);
    expect(response.body.items).toBeDefined();

    const firstPost = response.body.items[0];
    expect(firstPost.likeCount).toBe(2);
    expect(firstPost.likedByMe).toBe(true);
  });

  test('Test GET /posts - verify likedByMe for different user', async () => {
    const response = await request(app)
      .get('/posts')
      .set('Authorization', 'Bearer ' + accessToken2);

    expect(response.statusCode).toBe(200);

    const firstPost = response.body.items[0];
    expect(firstPost.likeCount).toBe(2);
    expect(firstPost.likedByMe).toBe(true);
  });

  test('Test POST /posts/:id/like - unauthorized (no token)', async () => {
    const response = await request(app)
      .post(`/posts/${post._id}/like`);

    expect(response.statusCode).toBe(401);
  });

  test('Test POST /posts/:id/like - invalid post ID', async () => {
    const response = await request(app)
      .post('/posts/invalid-id/like')
      .set('Authorization', 'Bearer ' + accessToken1);

    expect(response.statusCode).toBe(400);
  });

  test('Test POST /posts/:id/like - non-existent post', async () => {
    const fakePostId = '507f1f77bcf86cd799439011';
    const response = await request(app)
      .post(`/posts/${fakePostId}/like`)
      .set('Authorization', 'Bearer ' + accessToken1);

    expect(response.statusCode).toBe(404);
  });

  test('Test GET /posts - verify likedByMe is false when not liked', async () => {

    const postResponse = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer ' + accessToken1)
      .send({ message: 'Unliked post' });

    const newPostId = postResponse.body._id;

    const response = await request(app)
      .get('/posts')
      .set('Authorization', 'Bearer ' + accessToken1);

    expect(response.statusCode).toBe(200);

    const unlikedPost = response.body.items.find((p: any) => p._id === newPostId);
    expect(unlikedPost).toBeDefined();
    expect(unlikedPost.likeCount).toBe(0);
    expect(unlikedPost.likedByMe).toBe(false);
  });

  test('Test POST /posts/:id/like - unlike by second user', async () => {
    const response = await request(app)
      .post(`/posts/${post._id}/like`)
      .set('Authorization', 'Bearer ' + accessToken2);

    expect(response.statusCode).toBe(200);
    expect(response.body.liked).toBe(false);
    expect(response.body.likeCount).toBe(1);
  });

  test('Test DELETE post - cascade delete likes', async () => {

    const postResponse = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer ' + accessToken1)
      .send({ message: 'Post to delete with likes' });

    const postToDelete = postResponse.body._id;


    await request(app)
      .post(`/posts/${postToDelete}/like`)
      .set('Authorization', 'Bearer ' + accessToken1);


    const likesBeforeDelete = await Like.find({ post: postToDelete });
    expect(likesBeforeDelete.length).toBe(1);


    await request(app)
      .delete(`/posts/${postToDelete}`)
      .set('Authorization', 'Bearer ' + accessToken1);


    const likesAfterDelete = await Like.find({ post: postToDelete });
    expect(likesAfterDelete.length).toBe(0);
  });
});
