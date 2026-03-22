import api from '../api/apiHelpers';
import { tokenStorage } from '../utils/tokenStorage';
import { User, BackendUser, LoginResponse, RegisterData, ApiError } from '../types';


const transformUser = (backendUser: BackendUser): User => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  let avatarUrl: string;

  if (backendUser.profileImage) {
    if (backendUser.profileImage.startsWith('http')) {
      avatarUrl = backendUser.profileImage;
    } else {
      avatarUrl = `${baseURL}${backendUser.profileImage}`;
    }
  } else {
    avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(backendUser.username)}&background=random`;
  }

  return {
    id: backendUser._id,
    username: backendUser.username,
    email: backendUser.email,
    avatar: avatarUrl
  };
};

export const authService = {
  async login(emailOrUsername: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post<{ user: BackendUser; accessToken: string; refreshToken: string }>('/auth/login', {
        identifier: emailOrUsername,
        password: password,
      });

      const user = transformUser(response.user);

      tokenStorage.setAccessToken(response.accessToken);
      tokenStorage.setRefreshToken(response.refreshToken);
      tokenStorage.setUser(user);

      return {
        user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };
    } catch (error: any) {
      throw {
        code: error.code || 'LOGIN_FAILED',
        message: error.message || 'Login failed',
      } as ApiError;
    }
  },

  async register(userData: RegisterData): Promise<LoginResponse> {
    try {
      await api.post('/auth/register', {
        email: userData.email,
        username: userData.username,
        password: userData.password,
      });

      return await this.login(userData.email, userData.password);
    } catch (error: any) {
      throw {
        code: error.code || 'REGISTRATION_FAILED',
        message: error.message || 'Registration failed',
      } as ApiError;
    }
  },


  async socialLogin(provider: string): Promise<LoginResponse> {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

      if (provider === 'google') {
        window.location.href = `${baseUrl}/auth/google`;
      } else {
        throw {
          code: 'INVALID_PROVIDER',
          message: 'Invalid OAuth provider',
        };
      }

      return new Promise(() => { });
    } catch (error: any) {
      throw {
        code: error.code || 'SOCIAL_LOGIN_FAILED',
        message: error.message || 'Social login failed',
      } as ApiError;
    }
  },


  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        throw {
          code: 'NO_REFRESH_TOKEN',
          message: 'No refresh token available',
        };
      }

      const response = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        refreshToken,
      });

      tokenStorage.setAccessToken(response.accessToken);
      if (response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken);
      }

      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      };
    } catch (error: any) {
      tokenStorage.clearAll();
      throw {
        code: error.code || 'REFRESH_FAILED',
        message: error.message || 'Token refresh failed',
      } as ApiError;
    }
  },


  async logout(): Promise<void> {
    try {
      const refreshToken = tokenStorage.getRefreshToken();

      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      tokenStorage.clearAll();
    }
  },


  getCurrentUser(): User | null {
    return tokenStorage.getUser();
  },


  isAuthenticated(): boolean {
    return !!tokenStorage.getAccessToken();
  },
};
