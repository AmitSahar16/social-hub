import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../../services/authService';
import { AuthContextValue, User, RegisterData, LoginResponse, ApiError, AuthStatus } from '../../types';

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState<ApiError | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsInitialized(true);
  }, []);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      setStatus('loading');
      setError(null);
      const response = await authService.login(email, password);
      setUser(response.user);
      setStatus('success');
      return response;
    } catch (err) {
      setError(err as ApiError);
      setStatus('error');
      throw err;
    }
  };

  const register = async (userData: RegisterData): Promise<LoginResponse> => {
    try {
      setStatus('loading');
      setError(null);
      const response = await authService.register(userData);
      setUser(response.user);
      setStatus('success');
      return response;
    } catch (err) {
      setError(err as ApiError);
      setStatus('error');
      throw err;
    }
  };

  const socialLogin = async (provider: string): Promise<LoginResponse> => {
    try {
      setStatus('loading');
      setError(null);
      const response = await authService.socialLogin(provider);
      setUser(response.user);
      setStatus('success');
      return response;
    } catch (err) {
      setError(err as ApiError);
      setStatus('error');
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      setStatus('idle');
      setError(null);
    } catch (err) {
      setError(err as ApiError);
    }
  };

  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextValue = {
    user,
    status,
    error,
    isAuthenticated: !!user,
    isInitialized,
    login,
    register,
    socialLogin,
    logout,
    updateUser,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
