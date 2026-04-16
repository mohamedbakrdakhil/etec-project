import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = ({ pageTitle, pageSubtitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', sidebarOpen);
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="header">
        <div className="header-left">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="header-title">
            <h1>{pageTitle || 'ETEC'}</h1>
            {pageSubtitle && <p>{pageSubtitle}</p>}
          </div>
        </div>
      </div>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
