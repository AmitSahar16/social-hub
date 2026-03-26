import { Express } from 'express';
import swaggerUI from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import { BASE_URL } from './env';

export const configSwagger = (app: Express) => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Web Project API Assignment 2',
        version: '1.0.0',
        description: 'REST API with JWT authentication, CRUD operations for Users, Posts, Comments, Likes, and AI Search',
      },
      servers: [{ url: BASE_URL }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
  };

  const swaggerSpec = swaggerJsDoc(options);

  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
};
