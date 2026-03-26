import Comment from '../models/comment';
import Post from '../models/post';
import { IAuthRequest } from '../types';
import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';

class CommentsController {
  getAllComments = asyncHandler(async (req: Request, res: Response) => {
    const comments = await Comment.find()
      .sort({ createdAt: -1 })
      .populate('user', 'username email profileImage');

    res.json(comments);
  });

  getCommentById = asyncHandler(async (req: Request, res: Response) => {
    const comment = await Comment.findById(req.params.id)
      .populate('user', 'username email profileImage');

    if (!comment) {
      throw new AppError(404, 'Comment not found', 'COMMENT_NOT_FOUND');
    }

    res.json(comment);
  });

  getCommentsByPostId = asyncHandler(async (req: Request, res: Response) => {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate('user', 'username email profileImage');

    res.json(comments);
  });

  createComment = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const comment = await Comment.create({
      text: req.body.text,
      post: req.body.post,
      user: req.user._id,
    });

    await Post.findByIdAndUpdate(req.body.post, { $inc: { commentCount: 1 } });

    const populatedComment = await comment.populate('user', 'username email profileImage');
    res.status(201).json(populatedComment);
  });

  createCommentForPost = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const comment = await Comment.create({
      text: req.body.text,
      post: req.params.postId,
      user: req.user._id,
    });

    await Post.findByIdAndUpdate(req.params.postId, { $inc: { commentCount: 1 } });

    const populatedComment = await comment.populate('user', 'username email profileImage');
    res.status(201).json(populatedComment);
  });

  updateComment = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const comment = await Comment.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { text: req.body.text },
      { new: true }
    ).populate('user', 'username email profileImage');

    if (!comment) {
      throw new AppError(404, 'Comment not found', 'COMMENT_NOT_FOUND');
    }

    res.json(comment);
  });

  deleteComment = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!comment) {
      throw new AppError(404, 'Comment not found', 'COMMENT_NOT_FOUND');
    }

    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.json({ message: 'Comment deleted successfully' });
  });
}

export default new CommentsController();
