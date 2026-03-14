import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthContext';
import InlineAlert from '../components/common/InlineAlert';
import { ApiError } from '../types';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, socialLogin, status, error, isAuthenticated, clearError } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setLocalError(null);
    if (error) clearError();
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setLocalError('Please fill in all fields');
      return false;
    }

    if (formData.username.length < 3) {
      setLocalError('Username must be at least 3 characters');
      return false;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!validateForm()) return;

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
    } catch (err) {
      const error = err as ApiError;
      setLocalError(error.message || 'Registration failed');
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      await socialLogin(provider);
    } catch (err) {
      const error = err as ApiError;
      setLocalError(error.message || 'Login failed');
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="card shadow-sm" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <div
              className="gradient-bg rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ width: '64px', height: '64px' }}
            >
              <i className="bi bi-heart-fill text-white" style={{ fontSize: '1.75rem' }}></i>
            </div>
            <h3 className="fw-bold mb-2">Create Account</h3>
            <p className="text-muted">Join SocialHub today</p>
          </div>

          {(localError || error) && (
            <InlineAlert
              type="danger"
              message={localError || error}
              onDismiss={() => {
                setLocalError(null);
                if (error) clearError();
              }}
            />
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                disabled={isLoading}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={isLoading}
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
                  placeholder="Create a password"
                  disabled={isLoading}
                  style={{ paddingRight: '2.5rem' }}
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

            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="position-relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  style={{ textDecoration: 'none', zIndex: 10 }}
                >
                  <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
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
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <div className="text-center mb-3">
            <span className="text-muted">or sign up with</span>
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
            <span className="text-muted">Already have an account? </span>
            <Link to="/login" className="text-decoration-none fw-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
