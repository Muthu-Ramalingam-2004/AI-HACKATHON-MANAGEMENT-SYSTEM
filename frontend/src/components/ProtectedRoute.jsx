import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div class="flex items-center justify-center min-h-screen bg-slate-950">
        <div class="relative w-16 h-16">
          <div class="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-pulse"></div>
          <div class="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect user to their appropriate dashboard if they land in the wrong place
    const defaultRedirects = {
      admin: '/dashboard/admin',
      college: '/dashboard/college',
      judge: '/dashboard/judge',
      participant: '/dashboard/participant'
    };
    return <Navigate to={defaultRedirects[user?.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
