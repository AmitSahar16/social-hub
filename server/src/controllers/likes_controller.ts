import Like from '../models/like';
import Post from '../models/post';
import { IAuthRequest } from '../types';
import { Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';

class LikesController {
  toggleLike = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      throw new AppError(404, 'Post not found', 'POST_NOT_FOUND');
    }

    const existingLike = await Like.findOne({ post: postId, user: userId });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });

      const updatedPost = await Post.findById(postId);
      const likeCount = updatedPost?.likeCount || 0;

      return res.json({
        liked: false,
        likeCount,
        message: 'Post unliked successfully',
      });
    } else {
      await Like.create({ post: postId, user: userId });
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });

      const updatedPost = await Post.findById(postId);
      const likeCount = updatedPost?.likeCount || 0;

      return res.json({
        liked: true,
        likeCount,
        message: 'Post liked successfully',
      });
    }
  });

  getLikesByPostId = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const { postId } = req.params;

    const likes = await Like.find({ post: postId }).populate('user', 'username email profileImage');

    res.json(likes);
  });
}

export default new LikesController();
