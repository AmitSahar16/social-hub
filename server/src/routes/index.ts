import express from 'express';
import authRoutes from './auth_route';
import postRoutes from './posts_route';
import likeRoutes from './likes_route';
import commentRoutes from './comments_route';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/posts', likeRoutes);
router.use('/comments', commentRoutes);

export default router;