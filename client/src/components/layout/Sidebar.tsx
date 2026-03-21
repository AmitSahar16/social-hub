import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: 'house-door-fill', label: 'Home' },
    { path: '/profile', icon: 'person-fill', label: 'Profile' },
    { path: '/create', icon: 'plus-square-fill', label: 'Create Post' }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="card">
      <div className="card-body p-0">
        <div className="list-group list-group-flush">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`list-group-item list-group-item-action border-0 d-flex align-items-center ${isActive(item.path) ? 'active' : ''
                }`}
              style={{
                backgroundColor: isActive(item.path) ? 'rgba(123, 77, 255, 0.1)' : 'transparent',
                color: isActive(item.path) ? 'var(--accent-purple)' : 'inherit',
                borderLeft: isActive(item.path) ? '3px solid var(--accent-purple)' : 'none'
              }}
            >
              <i className={`bi bi-${item.icon} me-3`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
