import express from 'express';
import authRoutes from './auth_route';

const router = express.Router();

router.use('/auth', authRoutes);

export default router;