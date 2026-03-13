Social Posts Platform

Full-Stack Social Network for Post Sharing

Project Overview



This project implements a full-stack social platform for sharing posts, allowing users to publish and explore content created by other users.



The system follows a client-server architecture and includes authentication, post management, a dynamic feed, and intelligent search capabilities.



Users can create posts containing text and images, browse posts shared by other users, and interact with the platform through a modern web interface.



The system also integrates AI-based semantic search, allowing users to find relevant posts using natural language queries.



System Architecture



The application is divided into two main components:



project-root

│

├── client/      # React frontend

├── server/      # Node.js / TypeScript backend

└── README.md

Client



Responsible for:



user interface



user interactions



displaying posts and profiles



communicating with the server



Server



Responsible for:



business logic



database operations



authentication



REST API



AI integration



testing and validation



Functional Features

User Management



Users can:



register to the platform



log in and log out



remain authenticated across sessions



view and update their profile



view their own posts



Post Management



The platform allows users to:



create posts



edit their posts



delete their posts



view posts from other users



upload images associated with posts



Each post may include:



title



text content



image



author information



creation date



Feed System



The main page displays a post feed containing posts from multiple users.



The feed supports:



infinite scrolling



progressive loading (paging)



dynamic content updates



Posts are loaded in batches as the user scrolls.



AI Integration



The platform integrates Artificial Intelligence to provide semantic search capabilities.



Instead of traditional keyword search, users can write queries in natural language, for example:



"posts about hiking trails"



"cheap food recommendations"



"beautiful beaches to visit"



The AI analyzes the meaning of the query and retrieves the most relevant posts.



Backend Design



The backend is implemented using Node.js with TypeScript and follows a modular architecture.



Main components include:



Routes



Controllers



Services



Data models



Middleware



AI integration layer



The server exposes a REST API consumed by the frontend.



REST API



The backend provides endpoints for managing users and posts.



Authentication

POST /auth/register

POST /auth/login

POST /auth/logout

Users

GET /users/profile

PUT /users/profile

GET /users/:id

Posts

GET /posts

GET /posts/:id

POST /posts

PUT /posts/:id

DELETE /posts/:id

Search

POST /posts/search



Performs semantic search using AI.



API Documentation



All APIs are documented using Swagger.



The Swagger interface is available at:



/api/docs



Swagger documentation includes:



endpoint descriptions



request parameters



request body schemas



response schemas



status codes



Testing



The backend includes unit tests for all internal API endpoints.




Run tests using:



npm test

Test Coverage



The project includes automated test coverage reporting.



Run coverage analysis:



npm run test:coverage



Coverage includes:



statements



branches



functions



lines



The report is generated in:



/coverage

Client Design



The frontend is built using React and TypeScript.



Main responsibilities include:



displaying the feed



managing UI state



handling authentication



sending API requests



rendering search results



managing user interactions



User Interface Features

Feed Interface



infinite scrolling



progressive loading



dynamic updates



Post Interface



post creation form



post editing



post deletion



Search Interface



natural language search



AI powered filtering



results displayed inside the feed



Users can clear search results to return to the full feed.



Technologies Used

Frontend



React



TypeScript



REST API integration



modern UI components



Backend



Node.js



TypeScript



Express



Swagger



Testing



Jest



AI



Gemini


Installation



Clone the repository:



git clone <repository-url>



Install dependencies:



Client:



cd client

npm install



Server:



cd server

npm install



Run the backend:



cd server

npm run dev



Run the frontend:



cd client

npm start

Future Improvements



Possible improvements include:



post comments



likes and reactions



real-time notifications



advanced recommendation algorithms



improved AI content analysis



mobile interface

