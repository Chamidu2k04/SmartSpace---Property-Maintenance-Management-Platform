import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#050811] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
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
