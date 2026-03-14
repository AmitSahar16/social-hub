import { Request } from 'express';

export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password?: string;
  profileImage?: string;
  refreshTokens?: Array<string>;
  googleId?: string;
  createdViaGoogle?: boolean;
}

export interface IComment {
  _id?: string;
  text: string;
  post: string;
  user: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPost {
  _id: string;
  message: string;
  image?: string;
  user: string;
  likeCount?: number;
  commentCount?: number;
  embedding?: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILike {
  _id?: string;
  post: string;
  user: string;
  createdAt?: Date;
}

export interface IAuthRequest extends Request {
  user?: { _id: string };
}

export interface ITokenPayload {
  _id: string
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
  };
}

export interface SearchFilters {
  keywords?: string[];
  author?: string;
  dateFrom?: Date;
  dateTo?: Date;
  explanation: string;
}

export interface SemanticSearchResult {
  postId: string;
  score: number;
  reason: string;
}

export interface AIProvider {
  parseSearchQuery(query: string): Promise<SearchFilters>;
  rankPosts(query: string, posts: IPost[]): Promise<SemanticSearchResult[]>;
}

export interface PostCandidate {
  id: string;
  index: number;
  content: string;
  author: string;
  likes: number;
  comments: number;
  createdAt: Date;
}


