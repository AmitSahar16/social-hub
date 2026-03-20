import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { postsService } from '../../services/postsService';
import { useAuth } from '../auth/AuthContext';
import { Post, CreatePostData, UpdatePostData, ApiError } from '../../types';

interface PostsContextValue {
  posts: Post[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: ApiError | null;
  loadFeed: (page?: number) => Promise<Post[]>;
  loadUserPosts: (userId: string) => Promise<Post[]>;
  createPost: (postData: CreatePostData) => Promise<Post>;
  updatePost: (postId: string, updates: UpdatePostData) => Promise<Post>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  refreshPost: (postId: string) => Promise<Post>;
}

const PostsContext = createContext<PostsContextValue | null>(null);

export const usePosts = (): PostsContextValue => {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error('usePosts must be used within PostsProvider');
  }
  return context;
};

interface PostsProviderProps {
  children: ReactNode;
}

export const PostsProvider: React.FC<PostsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<ApiError | null>(null);

  const loadFeed = useCallback(async (page: number = 1): Promise<Post[]> => {
    try {
      setStatus('loading');
      setError(null);
      const feed = await postsService.getFeed(page);
      if (page === 1) {
        setPosts(feed);
      } else {
        setPosts(prev => [...prev, ...feed]);
      }
      setStatus('success');
      return feed;
    } catch (err: any) {
      setError(err as ApiError);
      setStatus('error');
      throw err;
    }
  }, []);

  const loadUserPosts = useCallback(async (userId: string): Promise<Post[]> => {
    try {
      setStatus('loading');
      setError(null);
      const userPosts = await postsService.getUserPosts(userId);
      setPosts(userPosts);
      setStatus('success');
      return userPosts;
    } catch (err: any) {
      setError(err as ApiError);
      setStatus('error');
      throw err;
    }
  }, []);

  const createPost = useCallback(async (postData: CreatePostData): Promise<Post> => {
    try {
      setStatus('loading');
      setError(null);
      const newPost = await postsService.createPost(postData);
      setPosts(prev => [newPost, ...prev]);
      setStatus('success');
      return newPost;
    } catch (err: any) {
      setError(err as ApiError);
      setStatus('error');
      throw err;
    }
  }, []);

  const updatePost = useCallback(async (postId: string, updates: UpdatePostData): Promise<Post> => {
    try {
      setError(null);
      const updated = await postsService.updatePost(postId, updates);
      setPosts(prev => prev.map(p => p.id === postId ? updated : p));
      return updated;
    } catch (err: any) {
      setError(err as ApiError);
      throw err;
    }
  }, []);

  const deletePost = useCallback(async (postId: string): Promise<void> => {
    try {
      setError(null);
      await postsService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      setError(err as ApiError);
      throw err;
    }
  }, []);

  const likePost = useCallback(async (postId: string): Promise<void> => {
    if (!user) return;

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = p.likedByMe;
        return {
          ...p,
          likes: isLiked ? p.likes - 1 : p.likes + 1,
          likedByMe: !isLiked,
        };
      }
      return p;
    }));

    try {
      const response = await postsService.toggleLike(postId, user.id);

      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: response.likeCount,
            likedByMe: response.liked,
          };
        }
        return p;
      }));
    } catch (err: any) {
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const isLiked = p.likedByMe;
          return {
            ...p,
            likes: isLiked ? p.likes + 1 : p.likes - 1,
            likedByMe: !isLiked,
          };
        }
        return p;
      }));
      setError(err as ApiError);
    }
  }, [user]);

  const refreshPost = useCallback(async (postId: string): Promise<Post> => {
    try {
      const refreshedPost = await postsService.getPost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? refreshedPost : p));
      return refreshedPost;
    } catch (err: any) {
      setError(err as ApiError);
      throw err;
    }
  }, []);

  const value = useMemo<PostsContextValue>(() => ({
    posts,
    status,
    error,
    loadFeed,
    loadUserPosts,
    createPost,
    updatePost,
    deletePost,
    likePost,
    refreshPost
  }), [
    posts,
    status,
    error,
    loadFeed,
    loadUserPosts,
    createPost,
    updatePost,
    deletePost,
    likePost,
    refreshPost
  ]);

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
};
