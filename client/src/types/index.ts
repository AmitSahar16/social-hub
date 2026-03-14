export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

export interface BackendUser {
  _id: string;
  username: string;
  email: string;
  profileImage?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface PostAuthor {
  id: string;
  username: string;
  avatar: string;
}

export interface Post {
  id: string;
  userId: string;
  author: PostAuthor | null;
  content: string;
  image: string | null;
  likes: number;
  likedBy: string[];
  comments: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  searchScore?: number;
  searchReason?: string;
}

export interface BackendPost {
  _id: string;
  user?: BackendUser | string;
  message?: string;
  image?: string;
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
  searchScore?: number;
  searchReason?: string;
}

export interface CreatePostData {
  content?: string;
  image?: File;
}

export interface UpdatePostData {
  content?: string;
  image?: File;
}

export interface CommentAuthor {
  id: string;
  username: string;
  avatar: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  author: CommentAuthor | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendComment {
  _id: string;
  post: string;
  user?: BackendUser | string;
  text?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  content: string;
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: any;
}

export type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  error: ApiError | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  register: (userData: RegisterData) => Promise<LoginResponse>;
  socialLogin: (provider: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  clearError: () => void;
}

export interface PostsContextValue {
  posts: Post[];
  loading: boolean;
  error: ApiError | null;
  hasMore: boolean;
  currentPage: number;
  loadPosts: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  refreshPosts: () => Promise<void>;
  createPost: (postData: CreatePostData) => Promise<Post>;
  updatePost: (postId: string, postData: UpdatePostData) => Promise<Post>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  clearError: () => void;
}
