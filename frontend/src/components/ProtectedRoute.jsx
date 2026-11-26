import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userToken, currentUser, userLoading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (!userToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && userLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-[#99F6E4] border-t-[#0D9488]"
          role="status"
          aria-label={t('common.verifyingAccess')}
        />
      </div>
    );
  }

  if (currentUser?.mustChangePassword && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace state={{ forcedPasswordChange: true }} />;
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/courses" replace />;
  }

  return children;
};
