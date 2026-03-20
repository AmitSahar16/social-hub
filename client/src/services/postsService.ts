import api, { buildQueryString } from '../api/apiHelpers';
import { Post, BackendPost, CreatePostData, UpdatePostData, ApiError } from '../types';

const transformPost = (backendPost: BackendPost): Post => {
  return {
    id: backendPost._id,
    userId: typeof backendPost.user === 'object' ? backendPost.user?._id : backendPost.user || '',
    author: typeof backendPost.user === 'object' && backendPost.user ? {
      id: backendPost.user._id,
      username: backendPost.user.username,
      avatar: backendPost.user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(backendPost.user.username)}&background=random`,
    } : null,
    content: backendPost.message || '',
    image: backendPost.image ? `${import.meta.env.VITE_API_BASE_URL}${backendPost.image}` : null,
    likes: backendPost.likeCount || 0,
    likedBy: [],
    comments: backendPost.commentCount || 0,
    likedByMe: backendPost.likedByMe || false,
    createdAt: backendPost.createdAt,
    updatedAt: backendPost.updatedAt,
    searchScore: backendPost.searchScore,
    searchReason: backendPost.searchReason,
  };
};

export const postsService = {
  async searchPosts(query: string): Promise<{ posts: Post[], explanation?: string, filters?: any, searchMethod?: string }> {
    try {
      const response = await api.post('/ai/search', { query });

      const data = response.data || response;

      const posts = (data.results || []).map(transformPost);

      return {
        posts,
        explanation: data.explanation,
        filters: data.filters,
        searchMethod: data.searchMethod
      };
    } catch (error: any) {
      console.error('Search error:', error);
      throw {
        code: error.code || 'SEARCH_FAILED',
        message: error.message || 'Search failed',
      } as ApiError;
    }
  },

  async getFeed(page: number = 1, limit: number = 10): Promise<Post[]> {
    try {
      const queryString = buildQueryString({
        page: page - 1,
        limit,
      });

      const response = await api.get<{ posts: BackendPost[] }>(`/posts${queryString}`);

      const posts = (response.posts || []).map(transformPost);

      return posts;
    } catch (error: any) {
      throw {
        code: error.code || 'FETCH_FAILED',
        message: error.message || 'Failed to fetch feed',
      } as ApiError;
    }
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    try {
      const queryString = buildQueryString({
        page: 0,
        limit: 50,
        userId,
      });

      const response = await api.get<{ posts: BackendPost[] }>(`/posts${queryString}`);
      const posts = (response.posts || []).map(transformPost);

      return posts;
    } catch (error: any) {
      throw {
        code: error.code || 'FETCH_FAILED',
        message: error.message || 'Failed to fetch user posts',
      } as ApiError;
    }
  },

  async getPost(postId: string): Promise<Post> {
    try {
      const response = await api.get<BackendPost>(`/posts/${postId}`);
      return transformPost(response);
    } catch (error: any) {
      throw {
        code: error.code || 'POST_NOT_FOUND',
        message: error.message || 'Post not found',
      } as ApiError;
    }
  },

  async createPost(postData: CreatePostData): Promise<Post> {
    try {
      const formData = new FormData();
      formData.append('message', postData.content || '');

      if (postData.image) {
        formData.append('image', postData.image);
      }

      const response = await api.upload<BackendPost>('/posts', formData);
      return transformPost(response);
    } catch (error: any) {
      throw {
        code: error.code || 'CREATE_FAILED',
        message: error.message || 'Failed to create post',
      } as ApiError;
    }
  },

  async updatePost(postId: string, updates: UpdatePostData): Promise<Post> {
    try {
      const formData = new FormData();

      if (updates.content !== undefined) {
        formData.append('message', updates.content);
      }

      if (updates.image) {
        formData.append('image', updates.image);
      }

      const response = await api.uploadPut<BackendPost>(`/posts/${postId}`, formData);
      return transformPost(response);
    } catch (error: any) {
      throw {
        code: error.code || 'UPDATE_FAILED',
        message: error.message || 'Failed to update post',
      } as ApiError;
    }
  },

  async deletePost(postId: string): Promise<void> {
    try {
      await api.delete(`/posts/${postId}`);
    } catch (error: any) {
      throw {
        code: error.code || 'DELETE_FAILED',
        message: error.message || 'Failed to delete post',
      } as ApiError;
    }
  },

  async toggleLike(postId: string, _userId: string): Promise<{ liked: boolean; likeCount: number }> {
    try {
      const response = await api.post<{ liked: boolean; likeCount: number }>(`/posts/${postId}/like`);

      return {
        liked: response.liked,
        likeCount: response.likeCount,
      };
    } catch (error: any) {
      throw {
        code: error.code || 'LIKE_FAILED',
        message: error.message || 'Failed to toggle like',
      } as ApiError;
    }
  },
};
