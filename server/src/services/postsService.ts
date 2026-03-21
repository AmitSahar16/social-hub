import Post from '../models/post';
import Like from '../models/like';
import Comment from '../models/comment';
import { Types } from 'mongoose';

export interface PostsPaginationOptions {
  page: number;
  limit: number;
  userId?: string;
  currentUserId?: string;
}

export interface PaginatedPostsResponse {
  posts: any[];
  hasMore: boolean;
}

class PostsService {
  private readonly MAX_LIMIT = 50;
  private readonly DEFAULT_LIMIT = 10;

  validatePaginationParams(page: any, limit: any): { page: number; limit: number } {
    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);

    if (page !== undefined && (isNaN(parsedPage) || parsedPage < 0)) {
      throw new Error('Invalid page parameter. Must be a non-negative integer.');
    }

    if (limit !== undefined && (isNaN(parsedLimit) || parsedLimit < 1)) {
      throw new Error('Invalid limit parameter. Must be a positive integer.');
    }

    const validatedPage = page !== undefined ? parsedPage : 0;
    const validatedLimit = limit !== undefined
      ? Math.min(parsedLimit, this.MAX_LIMIT)
      : this.DEFAULT_LIMIT;

    return {
      page: validatedPage,
      limit: validatedLimit,
    };
  }

  private async enrichPostsWithMetadata(posts: any[], currentUserId?: string): Promise<any[]> {
    if (posts.length === 0) return [];

    const postIds = posts.map(p => p._id);

    const userLikes = currentUserId
      ? await Like.find({ post: { $in: postIds }, user: currentUserId }).select('post').lean()
      : [];

    const likedPostsSet = new Set(
      userLikes.map((like: any) => like.post.toString())
    );

    return posts.map(post => {
      const postObj = post.toObject ? post.toObject() : post;
      const postId = postObj._id.toString();

      return {
        ...postObj,
        likeCount: postObj.likeCount || 0,
        commentCount: postObj.commentCount || 0,
        likedByMe: likedPostsSet.has(postId),
      };
    });
  }

  async getPaginatedPosts(options: PostsPaginationOptions): Promise<PaginatedPostsResponse> {
    const { page, limit, userId, currentUserId } = options;

    const skip = page * limit;

    const query: any = {};
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid userId format.');
      }
      query.user = userId;
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username email profileImage')
      .lean();

    const hasMore = await Post.exists({
      ...query,
      createdAt: posts.length > 0 ? { $lt: posts[posts.length - 1].createdAt } : undefined,
    }).then(result => result !== null);

    const enrichedPosts = await this.enrichPostsWithMetadata(posts, currentUserId);

    return {
      posts: enrichedPosts,
      hasMore,
    };
  }

  async getPaginatedPostsWithCount(options: PostsPaginationOptions): Promise<PaginatedPostsResponse> {
    const { page, limit, userId, currentUserId } = options;

    const skip = page * limit;

    const query: any = {};
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid userId format.');
      }
      query.user = userId;
    }

    const [posts, totalCount] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username email profileImage')
        .lean(),
      Post.countDocuments(query),
    ]);

    const hasMore = skip + posts.length < totalCount;

    const enrichedPosts = await this.enrichPostsWithMetadata(posts, currentUserId);

    return {
      posts: enrichedPosts,
      hasMore,
    };
  }
}

export default new PostsService();
