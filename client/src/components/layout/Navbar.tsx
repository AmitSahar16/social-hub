import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const searchMethod = searchParams.get('method');

  useEffect(() => {
    const queryFromUrl = searchParams.get('q');
    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
    } else {
      setSearchQuery('');
    }
  }, [searchParams]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const currentPath = location.pathname;
      navigate(`${currentPath}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isCreatePage = location.pathname === '/create';
  const isProfilePage = location.pathname.startsWith('/profile');
  const showSearchBar = !isCreatePage;
  const showAILabel = !isProfilePage && !isCreatePage;

  return (
    <nav className="navbar navbar-expand navbar-light bg-white border-bottom sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <div
            className="gradient-bg rounded-circle d-flex align-items-center justify-content-center me-2"
            style={{ width: '36px', height: '36px' }}
          >
            <i className="bi bi-heart-fill text-white"></i>
          </div>
          <span className="fw-bold">SocialHub</span>
        </Link>

        {showSearchBar && (
          <div className="mx-auto d-none d-md-block" style={{ maxWidth: '400px', width: '100%' }}>
            <form onSubmit={handleSearch}>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {showAILabel && (
                  <span className={`input-group-text border-0 ${searchMethod === 'vector' && searchQuery ? 'bg-success text-white' : 'bg-light text-muted'}`}>
                    <i className="bi bi-cpu me-1"></i>
                    AI
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="d-flex align-items-center gap-2">
          <Link to="/create" className="btn btn-primary">
            <i className="bi bi-plus-lg me-1"></i>
            Create
          </Link>

          <Link to="/profile" className="btn btn-link text-decoration-none p-0">
            <img
              src={user?.avatar}
              alt={user?.username}
              className="avatar-sm"
            />
          </Link>

          <button
            className="btn btn-link text-danger text-decoration-none"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
