import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

import Dashboard from '../pages/Dashboard';
import Transactions from '../pages/Transactions';
import Budgets from '../pages/Budgets';
import Analytics from '../pages/Analytics';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';

const PlaceholderAuthCallback = () => (
  <div className="p-8 text-center">
    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Callback Autentikasi</h2>
    <p className="text-sm text-slate-500 mt-2">Halaman ini akan menangani callback Google OAuth setelah integrasi backend.</p>
  </div>
);

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public - Auth */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback" element={<PlaceholderAuthCallback />} />
      </Route>

      {/* Protected - App */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
