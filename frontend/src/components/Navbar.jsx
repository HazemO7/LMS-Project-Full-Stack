import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Globe, List, Plus, ShieldCheck, SignOut, UserCircle, X } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { canAuthorCourses, isAdminOrSuper } from '../utils/roleUtils';
import { BrandMark } from './BrandMark';

const EMPTY_NAV_PERMISSIONS = { canCreateCourse: false, canAccessAdmin: false };

const getNavPermissions = (userToken, currentUser) => {
  if (!userToken) return EMPTY_NAV_PERMISSIONS;
  if (!currentUser) return EMPTY_NAV_PERMISSIONS;
  if (currentUser.mustChangePassword) return EMPTY_NAV_PERMISSIONS;
  return {
    canCreateCourse: canAuthorCourses(currentUser),
    canAccessAdmin: isAdminOrSuper(currentUser),
  };
};

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
    isActive
      ? 'bg-[#CCFBF1] text-[#0F766E] font-semibold'
      : 'text-[#335C5D] hover:bg-[#F0FDFA] hover:text-[#0B3B3C]'
  }`;

const PrimaryNavLinks = ({ canCreateCourse, canAccessAdmin, onNavigate, t }) => (
  <>
    <NavLink to="/" end className={navLinkClass} onClick={onNavigate}>
      {t('nav.home')}
    </NavLink>
    <NavLink to="/courses" className={navLinkClass} onClick={onNavigate}>
      {t('nav.courses')}
    </NavLink>
    <NavLink to="/about" className={navLinkClass} onClick={onNavigate}>
      {t('nav.about')}
    </NavLink>
    <NavLink to="/contact" className={navLinkClass} onClick={onNavigate}>
      {t('nav.contact')}
    </NavLink>
    {canCreateCourse && (
      <NavLink to="/course/new" className={navLinkClass} onClick={onNavigate}>
        <Plus size={15} weight="bold" aria-hidden="true" />
        {t('nav.createCourse')}
      </NavLink>
    )}
    {canAccessAdmin && (
      <NavLink to="/admin" className={navLinkClass} onClick={onNavigate}>
        <ShieldCheck size={15} weight="duotone" aria-hidden="true" />
        {t('nav.adminConsole')}
      </NavLink>
    )}
  </>
);

const DesktopAuthControls = ({ userToken, currentUser, roleLabel, onLogout, t }) => {
  if (!userToken) {
    return (
      <>
        <Link
          to="/login"
          className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#335C5D] transition-colors hover:bg-[#F0FDFA] hover:text-[#0B3B3C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
        >
          {t('nav.signIn')}
        </Link>
        <Link
          to="/register"
          className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
        >
          {t('nav.createAccount')}
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-3 py-1.5 text-sm font-medium text-[#0D2E2F] transition-colors hover:border-[#5EEAD4] hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
      >
        <UserCircle size={18} weight="duotone" aria-hidden="true" className="text-[#0D9488]" />
        <span>{currentUser?.name || t('nav.profile')}</span>
        {roleLabel && (
          <span className="rounded bg-[#FEF3C7] px-1.5 py-0.5 text-[11px] font-semibold text-[#92400E] ring-1 ring-[#FDE68A]">
            {roleLabel}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#CCFBF1] bg-white px-3 py-1.5 text-sm font-medium text-[#335C5D] transition-colors hover:border-[#FECACA] hover:bg-[#FEF2F2] hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
      >
        <SignOut size={16} aria-hidden="true" className="rtl:rotate-180" />
        {t('nav.signOut')}
      </button>
    </>
  );
};

const MobileAuthControls = ({ userToken, currentUser, roleLabel, onClose, onLogout, t }) => {
  if (!userToken) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Link
          to="/login"
          onClick={onClose}
          className="rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-3 py-2.5 text-center text-sm font-medium text-[#0D2E2F]"
        >
          {t('nav.signIn')}
        </Link>
        <Link
          to="/register"
          onClick={onClose}
          className="rounded-lg bg-[#0D9488] px-3 py-2.5 text-center text-sm font-semibold text-white"
        >
          {t('nav.createAccount')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Link
        to="/profile"
        onClick={onClose}
        className="flex items-center justify-between rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-3 py-2.5 text-sm font-medium text-[#0D2E2F]"
      >
        <span className="inline-flex items-center gap-2">
          <UserCircle size={18} weight="duotone" aria-hidden="true" className="text-[#0D9488]" />
          {currentUser?.name || t('nav.profile')}
        </span>
        {roleLabel && (
          <span className="rounded bg-[#FEF3C7] px-2 py-0.5 text-xs font-semibold text-[#92400E] ring-1 ring-[#FDE68A]">
            {roleLabel}
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-sm font-medium text-[#DC2626]"
      >
        <SignOut size={16} aria-hidden="true" className="rtl:rotate-180" />
        {t('nav.signOut')}
      </button>
    </div>
  );
};

const LanguageToggle = ({ langLabel, onToggle, ariaLabel, compact = false }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={ariaLabel}
    className={`inline-flex items-center rounded-lg border border-[#99F6E4] bg-[#F0FDFA] text-xs font-semibold text-[#0F766E] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
      compact ? 'h-10 gap-1 px-2.5' : 'gap-1.5 px-2.5 py-1.5'
    }`}
  >
    <Globe size={15} weight="duotone" aria-hidden="true" />
    <span>{langLabel}</span>
  </button>
);

const MobileDrawer = ({ open, permissions, authProps, onClose, onLogout, t }) => {
  if (!open) return null;
  return (
    <div className="border-t border-[#CCFBF1] bg-white px-4 py-4 md:hidden">
      <nav className="flex flex-col gap-1" aria-label={t('nav.mobileAria')}>
        <PrimaryNavLinks
          canCreateCourse={permissions.canCreateCourse}
          canAccessAdmin={permissions.canAccessAdmin}
          onNavigate={onClose}
          t={t}
        />
      </nav>
      <div className="mt-4 border-t border-[#CCFBF1] pt-4">
        <MobileAuthControls {...authProps} onClose={onClose} onLogout={onLogout} t={t} />
      </div>
    </div>
  );
};

export const Navbar = () => {
  const { userToken, currentUser, logoutUser } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const permissions = getNavPermissions(userToken, currentUser);
  const roleLabel = currentUser?.role ? t(`role.${currentUser.role}`) : '';
  const langLabel = lang === 'ar' ? t('nav.switchToEnglish') : t('nav.switchToArabic');

  const closeMobile = () => setMobileOpen(false);
  const handleLogout = () => {
    closeMobile();
    logoutUser();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#99F6E4] bg-white/95 backdrop-blur-sm">
      <div className="h-1 w-full bg-gradient-to-r from-[#0B3B3C] via-[#0D9488] to-[#F59E0B]" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            onClick={closeMobile}
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label={t('nav.mainAria')}>
            <PrimaryNavLinks
              canCreateCourse={permissions.canCreateCourse}
              canAccessAdmin={permissions.canAccessAdmin}
              t={t}
            />
          </nav>
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <LanguageToggle langLabel={langLabel} onToggle={toggleLanguage} ariaLabel={t('nav.switchAria')} />
          <DesktopAuthControls
            userToken={userToken}
            currentUser={currentUser}
            roleLabel={roleLabel}
            onLogout={handleLogout}
            t={t}
          />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle
            langLabel={langLabel}
            onToggle={toggleLanguage}
            ariaLabel={t('nav.switchAria')}
            compact
          />
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#99F6E4] bg-[#F0FDFA] text-[#0B3B3C] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <List size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <MobileDrawer
        open={mobileOpen}
        permissions={permissions}
        authProps={{ userToken, currentUser, roleLabel }}
        onClose={closeMobile}
        onLogout={handleLogout}
        t={t}
      />
    </header>
  );
};
