import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const AccessLoadingSpinner = ({ label }) => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div
      className="h-7 w-7 animate-spin rounded-full border-2 border-[#99F6E4] border-t-[#0D9488]"
      role="status"
      aria-label={label}
    />
  </div>
);

const isRoleDenied = (allowedRoles, currentUser) => {
  if (!allowedRoles || !currentUser) return false;
  return !allowedRoles.includes(currentUser.role);
};

const getRedirectTarget = ({ userToken, currentUser, allowedRoles, pathname, location }) => {
  if (!userToken) {
    return { to: '/login', state: { from: location } };
  }
  if (currentUser?.mustChangePassword && pathname !== '/profile') {
    return { to: '/profile', state: { forcedPasswordChange: true } };
  }
  if (isRoleDenied(allowedRoles, currentUser)) {
    return { to: '/courses' };
  }
  return null;
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userToken, currentUser, userLoading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (userToken && allowedRoles && userLoading) {
    return <AccessLoadingSpinner label={t('common.verifyingAccess')} />;
  }

  const redirect = getRedirectTarget({
    userToken,
    currentUser,
    allowedRoles,
    pathname: location.pathname,
    location,
  });
  if (redirect) {
    return <Navigate to={redirect.to} replace state={redirect.state} />;
  }

  return children;
};
