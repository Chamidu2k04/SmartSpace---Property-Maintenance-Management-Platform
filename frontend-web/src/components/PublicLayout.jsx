import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F3F4F6] text-gray-900 font-sans selection:bg-[#1E3A8A] selection:text-white">
      {/* Sticky Top Navigation */}
      <PublicNavbar />

      {/* Main Routed Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Site Footer */}
      <PublicFooter />
    </div>
  );
}
