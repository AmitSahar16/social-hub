import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthContext';
import InlineAlert from '../components/common/InlineAlert';
import { ApiError } from '../types';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, socialLogin, status, error: contextError, isAuthenticated, clearError } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [localError, setLocalError] = useState<ApiError | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }

    const oauthError = searchParams.get('error');
    if (oauthError) {
      setLocalError({ code: 'OAUTH_ERROR', message: oauthError });

      searchParams.delete('error');
      navigate({ search: searchParams.toString() }, { replace: true });
    }
  }, [isAuthenticated, navigate, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setLocalError(null);
    if (contextError) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!formData.username || !formData.password) {
      setLocalError({ code: 'VALIDATION_ERROR', message: 'Please fill in all fields' });
      return;
    }

    try {
      await login(formData.username, formData.password);
    } catch (err: any) {
      setLocalError(err);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      await socialLogin(provider);
    } catch (err: any) {
      setLocalError(err);
    }
  };

  const isLoading = status === 'loading';
  const error = localError || contextError;

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-sm" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <div
              className="gradient-bg rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: '64px', height: '64px' }}
            >
              <i className="bi bi-heart-fill text-white" style={{ fontSize: '1.75rem' }}></i>
            </div>
            <h3 className="fw-bold mb-2">Welcome Back</h3>
            <p className="text-muted">Sign in to continue to SocialHub</p>
          </div>

          {error && (
            <InlineAlert
              type="danger"
              message={error}
              onDismiss={() => {
                setLocalError(null);
                if (contextError) clearError();
              }}
            />
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username or Email</label>
              <input
                type="text"
                className="form-control"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username or email"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  style={{ paddingRight: '2.5rem' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{ textDecoration: 'none', zIndex: 10 }}
                >
                  <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mb-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="text-center mb-3">
            <span className="text-muted">or continue with</span>
          </div>

          <button
            className="btn btn-outline-secondary w-100"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
          >
            <i className="bi bi-google me-2"></i>
            Continue with Google
          </button>

          <div className="text-center mt-4">
            <span className="text-muted">Don't have an account? </span>
            <Link to="/register" className="text-decoration-none fw-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
