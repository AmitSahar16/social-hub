# Social Hub

A social platform for sharing posts, discovering content, and searching with natural language. Built with React and Node.js.

Social Hub is a straightforward social networking app. You can create posts, see what others have posted, and search for content using natural language instead of keywords. Instead of typing "hiking" and getting random results, you can say "great hiking trails with waterfalls" and get actually relevant posts.

It's split into two parts: a React frontend for the UI and a Node.js backend that handles the API and database.

## Getting Started

### What You Need

- Node.js (v16+)
- npm or yarn
- MongoDB
- A Google OAuth app (for login)
- A Google Gemini API key (for the AI search)

### Installation

Clone the repo:
```bash
git clone <repo-url>
cd social-hub
```

Set up your environment. In the `server/` folder, create a `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/social-hub
PORT=5000
JWT_SECRET=your_secret_here
JWT_EXPIRY=7d
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
GOOGLE_CALLBACK_URL=http://localhost:5173/auth/callback
GEMINI_API_KEY=your_gemini_key
```

In the `client/` folder, create a `.env` file:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Install packages:
```bash
cd server && npm install
cd ../client && npm install
```

### Running It Locally

Terminal 1 - Start the server:
```bash
cd server
npm run dev
```

Terminal 2 - Start the client:
```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser. The API runs on `http://localhost:5000`.

## How It's Built

**Frontend** — React + TypeScript using Vite. Handles the UI, manages auth state, talks to the API, and loads posts into the feed. 

**Backend** — Node.js + Express running a REST API. Handles user accounts, posts, comments, likes, stores everything in MongoDB, and integrates with Gemini for semantic search.

The entire API is documented in Swagger at `/api/docs`.

## Features

**User accounts**
- Sign up and log in
- Update your profile
- Stay logged in across sessions

**Posts**
- Create, edit, delete posts
- Add images to posts
- Browse everyone's posts
- Infinite scroll through the feed

**Interact with posts**
- Comment on posts
- Like posts
- See comment counts and likes

**Search**
- Type a natural language query: "summer travel tips" or "coffee shop recommendations"
- Get relevant results instead of keyword matches
- It actually works pretty well

## Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, MongoDB
- **Testing**: Jest
- **AI**: Google Gemini API
- **Docs**: Swagger

## Running Tests

```bash
cd server
npm test
```

For coverage:
```bash
npm run test:coverage
```

The coverage report goes into `/coverage`.

## API Endpoints

**Auth**
- `POST /api/auth/register` - Sign up
- `POST /api/auth/login` - Log in
- `POST /api/auth/logout` - Log out

**Users**
- `GET /api/users/profile` - Get your profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/:id` - View someone's profile

**Posts**
- `GET /api/posts` - Get posts (paginated)
- `GET /api/posts/:id` - Get a single post
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Edit post
- `DELETE /api/posts/:id` - Delete post

**Comments**
- `POST /api/comments` - Add comment
- `PUT /api/comments/:id` - Edit comment
- `DELETE /api/comments/:id` - Delete comment

**Likes**
- `POST /api/likes` - Like a post
- `DELETE /api/likes/:postId` - Unlike a post

**Search**
- `POST /api/posts/search` - AI-powered search

## File Structure

```
client/
├── src/
│   ├── components/    # UI components
│   ├── pages/         # Page components
│   ├── services/      # API calls
│   ├── context/       # Auth and post state
│   └── types/         # TypeScript types

server/
├── src/
│   ├── routes/        # API routes
│   ├── controllers/    # Request handlers
│   ├── services/      # Business logic
│   ├── models/        # MongoDB schemas
│   ├── middleware/    # Custom middleware
│   └── tests/         # Unit tests
```