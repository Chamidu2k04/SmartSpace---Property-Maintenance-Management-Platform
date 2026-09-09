import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public Layout & Static Marketing Pages
import PublicLayout from './components/PublicLayout';
import LandingPage from './pages/LandingPage';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Standalone Auth Pages
import Login from './pages/Login';

// Protected Route Guard & Internal Layout
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

// Teammate Dashboards & Feature Modules (100% Preserved)
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MaintenanceApprovals from './pages/MaintenanceApprovals';
import TechnicianProfile from './pages/TechnicianProfile';
import Inventory from './pages/Inventory';
import Scheduling from './pages/Scheduling';
import AdminUserDashboard from './pages/AdminUserDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================================
            1. PUBLIC-FACING ROUTES (Wrapped in PublicLayout: Navbar + Outlet + Footer)
            ===================================================================== */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route index element={<LandingPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Route>

        {/* =====================================================================
            2. STANDALONE AUTHENTICATION ROUTES (No Public Header/Footer)
            ===================================================================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} />
        
        {/* =====================================================================
            3. PROTECTED INTERNAL ROUTES (Teammate Dashboards & Modules)
            ===================================================================== */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/scheduling"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Scheduling />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Inventory />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Profile />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/maintenance"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <MaintenanceApprovals />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/technician-profile"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <TechnicianProfile />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminUserDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminUserDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* =====================================================================
            4. FALLBACK ROUTE
            ===================================================================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
