# Social Media Backend API

Production-grade REST API for social media platform with authentication, posts, comments, likes, image uploads, and AI-powered search.

## Features

### Authentication
- Username/password registration and login
- Google OAuth integration
- JWT access + refresh token flow
- Session persistence
- Secure logout

### User Profiles
- Get user profile (username + profile image)
- Update profile (username + image upload)
- View posts by specific user

### Posts
- Create post with text + optional image
- Global feed visible to all users
- Edit/delete own posts
- Filter posts by user
- Cursor-based pagination for infinite scroll
- Like count and comment count on feed
- `likedByMe` flag for current user

### Comments
- View comment count on posts
- Separate endpoint to list comments for a post
- Add comment (authenticated)
- Delete own comment

### Likes
- Like/unlike posts
- View like count
- Efficient DB design with unique compound index
- `likedByMe` status in feed

### AI Search
- Natural language query parsing (e.g., "posts about travel last week by alice")
- Structured filter extraction (keywords, author, timeframe)
- Per-user rate limiting (10 requests/hour)
- TTL caching (15 minutes) to reduce API costs
- Supports Gemini or mock provider
- Database search with parsed filters

### API Documentation
- Swagger UI at `/api-docs`
- Bearer auth scheme documented
- Request/response schemas
- Error format: `{ code, message }`
- Pagination examples

### Testing
- Unit/integration tests with Jest + Supertest
- Separate test database
- AI provider mocking in tests

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Update .env with your values (see Configuration below)

# Run in development
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production
npm start
```

## Configuration

Create `.env` file with the following:

```env
PORT=3000
NODE_ENV=development

# MongoDB (use _test suffix for test database automatically)
DATABASE_URL=mongodb://localhost:27017/socialdb

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
ACCESS_TOKEN_SECRET=your-access-secret-here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-refresh-secret-here
REFRESH_TOKEN_EXPIRY=7d

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Search (optional - uses mock provider if not set)
AI_PROVIDER=gemini
AI_API_KEY=your-ai-api-key
```

## API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/username + password
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/logout` - Logout (requires refresh token)
- `GET /auth/refresh` - Refresh access token

### Users
- `GET /users` - Get all users
- `GET /users/me` - Get my profile (auth)
- `GET /users/:id` - Get user by ID
- `PUT /users` - Update my profile (auth, supports multipart/form-data for image)

### Posts
- `GET /posts?limit=10&cursor=<id>` - Get posts feed with pagination
- `GET /posts/:id` - Get single post
- `GET /posts/user/me?limit=10&cursor=<id>` - Get my posts (auth)
- `GET /posts/user/:userId?limit=10&cursor=<id>` - Get posts by user
- `POST /posts` - Create post (auth, supports multipart/form-data for image)
- `PUT /posts/:id` - Update post (auth, owner only)
- `DELETE /posts/:id` - Delete post (auth, owner only)
- `GET /posts/:postId/comments` - Get comments for post

### Comments
- `GET /comments` - Get all comments
- `GET /comments/:id` - Get comment by ID
- `POST /comments` - Create comment (auth)
- `PUT /comments/:id` - Update comment (auth, owner only)
- `DELETE /comments/:id` - Delete comment (auth, owner only)

### Likes
- `POST /posts/:postId/like` - Toggle like on post (auth)
- `GET /posts/:postId/likes` - Get all likes for post

### AI Search
- `POST /ai/search` - Natural language search (auth, rate limited)
  ```json
  {
    "query": "posts about travel last week by alice"
  }
  ```

## Swagger Documentation

Once running, visit: `http://localhost:3000/api-docs`

## Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm run authTest
npm run postsTest
npm run commentsTest
npm run usersTest

# Run with coverage
npm run coverage
```