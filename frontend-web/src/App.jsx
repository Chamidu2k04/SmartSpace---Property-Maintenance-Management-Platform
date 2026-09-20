import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public Layout & Static Marketing Pages
import PublicLayout from './components/PublicLayout';
import LandingPage from './pages/LandingPage';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Standalone Auth Pages
import Login from './pages/Login';

// Role-Gated Access Page (Member 2 — Maintenance Request Management)
import AccessDenied from './pages/AccessDenied';

// Protected Route Guard & Internal Layout
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import { useAuthStore } from './store/useAuthStore';

/**
 * RequireRole — Inline role guard. Renders children only when the authenticated
 * user's role is in allowedRoles; otherwise renders <AccessDenied />.
 *
 * Role strings must match the backend JWT exactly:
 *   'Admin' | 'Tenant' | 'PropertyManager' | 'Technician' | 'InventoryOfficer'
 *
 * NOTE: This component was added by Member 2. Do NOT remove or relocate it
 * without coordinating across the team.
 */
function RequireRole({ allowedRoles, children }) {
  const user = useAuthStore((state) => state.user);
  if (!user || !allowedRoles.includes(user.role)) {
    return <AccessDenied />;
  }
  return children;
}

// Teammate Dashboards & Feature Modules (100% Preserved)
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MaintenanceApprovals from './pages/MaintenanceApprovals';
import TechnicianProfile from './pages/TechnicianProfile';
import Inventory from './pages/Inventory';
import Scheduling from './pages/Scheduling';
import Properties from './pages/Properties';
import AdminUserDashboard from './pages/AdminUserDashboard';
import AiAuditHistory from './pages/AiAuditHistory';

// Tenant Maintenance Pages (Member 2 — Maintenance Request Management)
import TenantMaintenance   from './pages/TenantMaintenance';
import TenantSubmitTicket  from './pages/TenantSubmitTicket';
import TenantTicketDetail  from './pages/TenantTicketDetail';

/**
 * DashboardGate — Redirects Tenants away from /dashboard (which is the
 * default post-login route) to their dedicated /tenant/maintenance page.
 * All other roles remain on /dashboard as before.
 *
 * NOTE: Added by Member 2. Login.jsx is NOT modified; the redirect happens
 * here so Auth team code is fully preserved.
 */
function DashboardGate({ children }) {
  const user = useAuthStore((state) => state.user);
  if (user?.role === 'Tenant') {
    return <Navigate to="/tenant/maintenance" replace />;
  }
  return children;
}

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
              <DashboardGate>
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              </DashboardGate>
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
          path="/properties"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Properties />
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

        {/* /maintenance — Property Manager only. RequireRole guard added by Member 2. */}
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <RequireRole allowedRoles={['PropertyManager']}>
                  <MaintenanceApprovals />
                </RequireRole>
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-audit"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <RequireRole allowedRoles={['PropertyManager']}>
                  <AiAuditHistory />
                </RequireRole>
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
            4. TENANT-ONLY ROUTES (Member 2 — Maintenance Request Management)
            ===================================================================== */}
        <Route
          path="/tenant/maintenance"
          element={
            <ProtectedRoute>
              <RequireRole allowedRoles={['Tenant']}>
                <TenantMaintenance />
              </RequireRole>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tenant/submit"
          element={
            <ProtectedRoute>
              <RequireRole allowedRoles={['Tenant']}>
                <TenantSubmitTicket />
              </RequireRole>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tenant/ticket/:id"
          element={
            <ProtectedRoute>
              <RequireRole allowedRoles={['Tenant']}>
                <TenantTicketDetail />
              </RequireRole>
            </ProtectedRoute>
          }
        />

        {/* =====================================================================
            5. FALLBACK ROUTE
            ===================================================================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
