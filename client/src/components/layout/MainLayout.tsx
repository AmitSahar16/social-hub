import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-vh-100">
      <Navbar />

      <div className="container py-4">
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            {children}
          </div>

          <div className="col-12 col-lg-4">
            <div className="position-sticky" style={{ top: '80px' }}>
              <Sidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
