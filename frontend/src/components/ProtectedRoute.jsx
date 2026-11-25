import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userToken, currentUser, userLoading } = useAuth();
  const location = useLocation();

  if (!userToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && userLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#1D4ED8]"
          role="status"
          aria-label="Verifying access"
        />
      </div>
    );
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/courses" replace />;
  }

  return children;
};
