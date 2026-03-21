import Post from '../models/post';
import Like from '../models/like';
import Comment from '../models/comment';
import { IAuthRequest } from '../types';
import { Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import postsService from '../services/postsService';

class PostsController {
  private async enrichPostsWithMetadata(posts: any[], userId?: string) {
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const postObj = post.toObject();
        const likedByMe = userId ? await Like.exists({ post: post._id, user: userId }) : false;

        return {
          ...postObj,
          likeCount: postObj.likeCount || 0,
          commentCount: postObj.commentCount || 0,
          likedByMe: !!likedByMe,
        };
      })
    );

    return enrichedPosts;
  }

  getPostsPaginated = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const hasPageParam = req.query.page !== undefined;

    if (hasPageParam) {
      try {
        const { page, limit } = postsService.validatePaginationParams(
          req.query.page,
          req.query.limit
        );

        const result = await postsService.getPaginatedPostsWithCount({
          page,
          limit,
          userId: req.query.userId as string | undefined,
          currentUserId: req.user?._id,
        });

        return res.json(result);
      } catch (error: any) {
        if (error.message.includes('Invalid')) {
          throw new AppError(400, error.message, 'INVALID_PARAMS');
        }
        throw error;
      }
    } else {
      const limit = parseInt(req.query.limit as string) || 10;
      const cursor = req.query.cursor as string;

      const query: any = {};
      if (cursor) {
        query._id = { $lt: cursor };
      }

      if (req.query.userId) {
        query.user = req.query.userId;
      }

      const posts = await Post.find(query)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .populate('user', 'username email profileImage');

      const hasMore = posts.length > limit;
      const postsToReturn = hasMore ? posts.slice(0, -1) : posts;
      const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]._id : null;

      const enrichedPosts = await this.enrichPostsWithMetadata(postsToReturn, req.user?._id);

      return res.json({
        items: enrichedPosts,
        nextCursor,
        hasMore,
      });
    }
  });

  getPostById = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const post = await Post.findById(req.params.id).populate('user', 'username email profileImage');

    if (!post) {
      throw new AppError(404, 'Post not found', 'POST_NOT_FOUND');
    }

    const enrichedPosts = await this.enrichPostsWithMetadata([post], req.user?._id);

    res.json(enrichedPosts[0]);
  });

  getMyPosts = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string;

    const query: any = { user: req.user._id };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const posts = await Post.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('user', 'username email profileImage');

    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]._id : null;

    const enrichedPosts = await this.enrichPostsWithMetadata(postsToReturn, req.user._id);

    res.json({
      items: enrichedPosts,
      nextCursor,
      hasMore,
    });
  });

  getPostsByUserId = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string;

    const query: any = { user: req.params.userId };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const posts = await Post.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('user', 'username email profileImage');

    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, -1) : posts;
    const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1]._id : null;

    const enrichedPosts = await this.enrichPostsWithMetadata(postsToReturn, req.user?._id);

    res.json({
      items: enrichedPosts,
      nextCursor,
      hasMore,
    });
  });

  createPost = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const postData: any = {
      message: req.body.message,
      user: req.user._id,
    };

    if (req.file) {
      postData.image = `/uploads/posts/${req.file.filename}`;
    }

    const post = await Post.create(postData);
    const populatedPost = await post.populate('user', 'username email profileImage');

    const enrichedPosts = await this.enrichPostsWithMetadata([populatedPost], req.user._id);

    res.status(201).json(enrichedPosts[0]);
  });

  updatePost = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const updateData: any = {};

    if (req.body.message !== undefined) {
      updateData.message = req.body.message;
    }

    if (req.file) {
      updateData.image = `/uploads/posts/${req.file.filename}`;
    }

    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    ).populate('user', 'username email profileImage');

    if (!post) {
      throw new AppError(404, 'Post not found', 'POST_NOT_FOUND');
    }

    const enrichedPosts = await this.enrichPostsWithMetadata([post], req.user._id);

    res.json(enrichedPosts[0]);
  });

  deletePost = asyncHandler(async (req: IAuthRequest, res: Response) => {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!post) {
      throw new AppError(404, 'Post not found', 'POST_NOT_FOUND');
    }

    await Like.deleteMany({ post: req.params.id });
    await Comment.deleteMany({ post: req.params.id });

    res.json({ message: 'Post deleted successfully' });
  });
}

export default new PostsController();
