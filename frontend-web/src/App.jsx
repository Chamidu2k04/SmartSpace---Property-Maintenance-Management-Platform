import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
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
          path="/profile"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Profile />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
