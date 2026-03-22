import api from '../api/apiHelpers';
import { Comment, BackendComment, CreateCommentData, ApiError } from '../types';

const transformComment = (backendComment: BackendComment): Comment => {
  return {
    id: backendComment._id,
    postId: backendComment.post,
    userId: typeof backendComment.user === 'object' ? backendComment.user?._id : backendComment.user || '',
    author: typeof backendComment.user === 'object' && backendComment.user ? {
      id: backendComment.user._id,
      username: backendComment.user.username,
      avatar: backendComment.user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(backendComment.user.username)}&background=random`,
    } : null,
    content: backendComment.text || backendComment.message || '',
    createdAt: backendComment.createdAt,
    updatedAt: backendComment.updatedAt,
  };
};

export const commentsService = {
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const response = await api.get<BackendComment[]>(`/posts/${postId}/comments`);
      return response.map(transformComment);
    } catch (error: any) {
      throw {
        code: error.code || 'FETCH_FAILED',
        message: error.message || 'Failed to fetch comments',
      } as ApiError;
    }
  },

  async addComment(postId: string, commentData: CreateCommentData): Promise<Comment> {
    try {
      const response = await api.post<BackendComment>('/comments', {
        text: commentData.content,
        post: postId,
      });

      return transformComment(response);
    } catch (error: any) {
      throw {
        code: error.code || 'CREATE_FAILED',
        message: error.message || 'Failed to add comment',
      } as ApiError;
    }
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    try {
      const response = await api.put<BackendComment>(`/comments/${commentId}`, {
        text: content,
      });

      return transformComment(response);
    } catch (error: any) {
      throw {
        code: error.code || 'UPDATE_FAILED',
        message: error.message || 'Failed to update comment',
      } as ApiError;
    }
  },

  async deleteComment(_postId: string, commentId: string): Promise<void> {
    try {
      await api.delete(`/comments/${commentId}`);
    } catch (error: any) {
      throw {
        code: error.code || 'DELETE_FAILED',
        message: error.message || 'Failed to delete comment',
      } as ApiError;
    }
  },

  async getCommentCount(postId: string): Promise<number> {
    try {
      const comments = await this.getComments(postId);
      return comments.length;
    } catch (error) {
      return 0;
    }
  },
};
