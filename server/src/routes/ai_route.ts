import express from 'express';
import aiController from '../controllers/ai_controller';
import authMiddleware from '../middleware/auth';

/**
 * @swagger
 * components:
 *   schemas:
 *     AISearchRequest:
 *       type: object
 *       required:
 *         - query
 *       properties:
 *         query:
 *           type: string
 *           example: funny cat videos from last week
 *           description: Natural language search query
 *     SearchFilters:
 *       type: object
 *       properties:
 *         keywords:
 *           type: array
 *           items:
 *             type: string
 *           example: [cat, funny, video]
 *         author:
 *           type: string
 *           example: john_doe
 *         dateFrom:
 *           type: string
 *           format: date-time
 *         dateTo:
 *           type: string
 *           format: date-time
 *         explanation:
 *           type: string
 *           example: Searching for posts about cats that are funny
 *     AISearchResult:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         content:
 *           type: string
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             username:
 *               type: string
 *             profileImage:
 *               type: string
 *         image:
 *           type: string
 *         likeCount:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         searchScore:
 *           type: number
 *           format: float
 *           example: 0.87
 *           description: Relevance score (0-1)
 *         searchReason:
 *           type: string
 *           example: Vector similarity match
 *     AISearchResponse:
 *       type: object
 *       properties:
 *         query:
 *           type: string
 *           example: funny cat videos
 *         filters:
 *           $ref: '#/components/schemas/SearchFilters'
 *         results:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AISearchResult'
 *         count:
 *           type: integer
 *           example: 5
 *         totalCandidates:
 *           type: integer
 *           example: 15
 *         searchMethod:
 *           type: string
 *           enum: [vector, keyword]
 *           example: vector
 *         fromCache:
 *           type: boolean
 *           example: false
 *         explanation:
 *           type: string
 *           example: Searching for posts about funny cats
 *         rateLimitRemaining:
 *           type: integer
 *           example: 8
 *         processingTime:
 *           type: integer
 *           example: 1250
 */

const router = express.Router();

/**
 * @swagger
 * /ai/search:
 *   post:
 *     summary: AI-powered semantic search with vector embeddings and Gemini ranking
 *     description: |
 *       Performs intelligent search using Google Gemini API for:
 *       - Query parsing and intent extraction
 *       - Vector embeddings (gemini-embedding-001) for semantic similarity
 *       - LLM-based post ranking (gemini-1.5-pro)
 *       
 *       Rate Limit: 10 requests per hour per user
 *       
 *       Search Flow:
 *       1. Parse query to extract keywords, author, date filters
 *       2. Generate query embedding (3072 dimensions)
 *       3. Find similar posts using cosine similarity (threshold: 0.5)
 *       4. Fallback to keyword search if vector search fails
 *       5. Rank results using Gemini LLM
 *       
 *       Note: This endpoint proxies external Gemini API calls
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AISearchRequest'
 *     responses:
 *       200:
 *         description: Search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AISearchResponse'
 *       400:
 *         description: Invalid query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Query is required
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: AI search rate limit exceeded. Try again in 3456 seconds.
 */
router.post('/search', authMiddleware, aiController.search);

export default router;
