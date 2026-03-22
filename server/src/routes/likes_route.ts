import express from 'express';
import likesController from '../controllers/likes_controller';
import authMiddleware from '../middleware/auth';

/**
 * @swagger
 * components:
 *   schemas:
 *     Like:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *         user:
 *           type: string
 *           example: 507f1f77bcf86cd799439012
 *         post:
 *           type: string
 *           example: 507f1f77bcf86cd799439013
 *         createdAt:
 *           type: string
 *           format: date-time
 *     LikeResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           enum: [liked, unliked]
 *           example: liked
 *         likesCount:
 *           type: integer
 *           example: 42
 */

const router = express.Router();

/**
 * @swagger
 * /likes/{postId}/like:
 *   post:
 *     summary: Toggle like on a post
 *     description: Adds a like if not already liked, removes like if already liked
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LikeResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.post('/:postId/like', authMiddleware, likesController.toggleLike);

/**
 * @swagger
 * /likes/{postId}/likes:
 *   get:
 *     summary: Get all likes for a post
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Likes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Like'
 *       404:
 *         description: Post not found
 */
router.get('/:postId/likes', likesController.getLikesByPostId);

export default router;
