import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthContext';
import { tokenStorage } from '../utils/tokenStorage';

const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');

      if (!accessToken || !refreshToken) {
        console.error('Missing tokens in callback');
        navigate('/login');
        return;
      }

      try {
        tokenStorage.setAccessToken(accessToken);
        tokenStorage.setRefreshToken(refreshToken);

        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

        const response = await fetch(`${baseURL}/users/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const userData = await response.json();

        const avatarUrl = userData.profileImage
          ? (userData.profileImage.startsWith('http')
            ? userData.profileImage
            : `${baseURL}${userData.profileImage}`)
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.username)}&background=random`;

        const user = {
          id: userData._id,
          username: userData.username,
          email: userData.email,
          avatar: avatarUrl,
        };

        updateUser(user);
        tokenStorage.setUser(user);

        navigate('/');
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="container text-center mt-5">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="mt-3">Completing sign in...</p>
    </div>
  );
};

export default AuthCallbackPage;
