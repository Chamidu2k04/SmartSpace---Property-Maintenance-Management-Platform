import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Public Layout & Marketing Pages
import PublicLayout from '../components/PublicLayout';
import LandingPage from '../pages/LandingPage';
import AboutUs from '../pages/AboutUs';
import PrivacyPolicy from '../pages/PrivacyPolicy';

// Standalone Auth Pages
import Login from '../pages/Login';

// Protected Route Guard & Internal Layout
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../components/AdminLayout';

// Teammate Dashboards & Feature Modules (Preserved without modifications)
import Dashboard from '../pages/Dashboard';
import MaintenanceApprovals from '../pages/MaintenanceApprovals';
import Scheduling from '../pages/Scheduling';
import Inventory from '../pages/Inventory';
import Profile from '../pages/Profile';
import TechnicianProfile from '../pages/TechnicianProfile';
import AdminUserDashboard from '../pages/AdminUserDashboard';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Marketing Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route index element={<LandingPage />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Route>

      {/* 2. Standalone Auth Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Login />} />

      {/* 3. Protected Dashboard Routes */}
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

      {/* 4. Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
