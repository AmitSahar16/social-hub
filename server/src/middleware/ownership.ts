import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import Post from '../models/post';
import Comment from '../models/comment';
import { AppError, asyncHandler } from './errorHandler';

export const checkPostOwnership = asyncHandler(async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const id = req.params.id;
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const post = await Post.findById(id);

  if (!post) {
    throw new AppError(404, 'Post not found', 'POST_NOT_FOUND');
  }

  if (post.user.toString() !== userId.toString()) {
    throw new AppError(403, 'Forbidden: You can only modify your own posts', 'FORBIDDEN');
  }

  next();
});

export const checkCommentOwnership = asyncHandler(async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const id = req.params.id;
  const userId = req.user?._id;

  if (!userId) {
    throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
  }

  const comment = await Comment.findById(id);

  if (!comment) {
    throw new AppError(404, 'Comment not found', 'COMMENT_NOT_FOUND');
  }

  if (comment.user.toString() !== userId.toString()) {
    throw new AppError(403, 'Forbidden: You can only modify your own comments', 'FORBIDDEN');
  }

  next();
});

