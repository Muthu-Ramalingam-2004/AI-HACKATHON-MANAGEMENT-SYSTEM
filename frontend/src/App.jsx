import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import BackendHealthGate from './components/BackendHealthGate';

import Login from './pages/Login';
import Register from './pages/Register';
import Leaderboard from './pages/Leaderboard';
import ParticipantDashboard from './pages/ParticipantDashboard';
import CollegeDashboard from './pages/CollegeDashboard';
import JudgeDashboard from './pages/JudgeDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

const RootRedirect = () => {
  const role = localStorage.getItem('userRole');
  if (!role) return <Navigate to="/login" replace />;
  const dashboardRoutes = {
    admin: '/dashboard/admin',
    college: '/dashboard/college',
    judge: '/dashboard/judge',
    participant: '/dashboard/participant',
  };
  return <Navigate to={dashboardRoutes[role] || '/login'} replace />;
};

function App() {
  return (
    <Router>
      <BackendHealthGate>
        <AuthProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/dashboard/admin/*" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <ErrorBoundary>
                  <SuperAdminDashboard />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/dashboard/college/*" element={
            <ProtectedRoute allowedRoles={['admin', 'college']}>
              <Layout>
                <ErrorBoundary>
                  <CollegeDashboard />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/dashboard/judge/*" element={
            <ProtectedRoute allowedRoles={['admin', 'judge']}>
              <Layout>
                <ErrorBoundary>
                  <JudgeDashboard />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/dashboard/participant/*" element={
            <ProtectedRoute allowedRoles={['participant']}>
              <Layout>
                <ErrorBoundary>
                  <ParticipantDashboard />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/leaderboard" element={
            <ProtectedRoute>
              <Layout>
                <ErrorBoundary>
                  <Leaderboard />
                </ErrorBoundary>
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      </BackendHealthGate>
    </Router>
  );
}

export default App;
