// src/components/AppLayout.jsx
import React from 'react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
};

const sidebarContainerStyle = {
  flex: '0 0 250px',
  zIndex: 2,
};

const contentStyle = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
};

function AppLayout() {
  return (
    <div style={layoutStyle}>
      <div style={sidebarContainerStyle}>
        <Sidebar />
      </div>
      <main style={contentStyle}>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;