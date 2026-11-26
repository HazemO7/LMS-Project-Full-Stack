import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Globe, List, Plus, ShieldCheck, SignOut, UserCircle, X } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BrandMark } from './BrandMark';

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
    isActive
      ? 'bg-[#CCFBF1] text-[#0F766E] font-semibold'
      : 'text-[#335C5D] hover:bg-[#F0FDFA] hover:text-[#0B3B3C]'
  }`;

export const Navbar = () => {
  const { userToken, currentUser, logoutUser } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const mustRotatePw = Boolean(currentUser?.mustChangePassword);
  const canCreateCourse =
    !mustRotatePw &&
    currentUser &&
    ['super_admin', 'admin', 'instructor'].includes(currentUser.role);
  const canAccessAdmin =
    !mustRotatePw &&
    currentUser &&
    ['super_admin', 'admin'].includes(currentUser.role);

  const handleLogout = () => {
    setMobileOpen(false);
    logoutUser();
    navigate('/login');
  };

  const roleLabel = currentUser?.role ? t(`role.${currentUser.role}`) : '';

  return (
    <header className="sticky top-0 z-40 border-b border-[#99F6E4] bg-white/95 backdrop-blur-sm">
      <div className="h-1 w-full bg-gradient-to-r from-[#0B3B3C] via-[#0D9488] to-[#F59E0B]" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label={t('nav.mainAria')}>
            <NavLink to="/" end className={navLinkClass}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/courses" className={navLinkClass}>
              {t('nav.courses')}
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              {t('nav.about')}
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              {t('nav.contact')}
            </NavLink>
            {userToken && canCreateCourse && (
              <NavLink to="/course/new" className={navLinkClass}>
                <Plus size={15} weight="bold" aria-hidden="true" />
                {t('nav.createCourse')}
              </NavLink>
            )}
            {userToken && canAccessAdmin && (
              <NavLink to="/admin" className={navLinkClass}>
                <ShieldCheck size={15} weight="duotone" aria-hidden="true" />
                {t('nav.adminConsole')}
              </NavLink>
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={t('nav.switchAria')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-2.5 py-1.5 text-xs font-semibold text-[#0F766E] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            <Globe size={15} weight="duotone" aria-hidden="true" />
            <span>{lang === 'ar' ? t('nav.switchToEnglish') : t('nav.switchToArabic')}</span>
          </button>

          {userToken ? (
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
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#CCFBF1] bg-white px-3 py-1.5 text-sm font-medium text-[#335C5D] transition-colors hover:border-[#FECACA] hover:bg-[#FEF2F2] hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              >
                <SignOut size={16} aria-hidden="true" className="rtl:rotate-180" />
                {t('nav.signOut')}
              </button>
            </>
          ) : (
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
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={t('nav.switchAria')}
            className="inline-flex h-10 items-center gap-1 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-2.5 text-xs font-semibold text-[#0F766E] hover:bg-[#CCFBF1]"
          >
            <Globe size={15} weight="duotone" aria-hidden="true" />
            <span>{lang === 'ar' ? t('nav.switchToEnglish') : t('nav.switchToArabic')}</span>
          </button>

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

      {mobileOpen && (
        <div className="border-t border-[#CCFBF1] bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label={t('nav.mobileAria')}>
            <NavLink to="/" end className={navLinkClass} onClick={() => setMobileOpen(false)}>
              {t('nav.home')}
            </NavLink>
            <NavLink to="/courses" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              {t('nav.courses')}
            </NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              {t('nav.about')}
            </NavLink>
            <NavLink to="/contact" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              {t('nav.contact')}
            </NavLink>
            {userToken && canCreateCourse && (
              <NavLink
                to="/course/new"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                <Plus size={15} weight="bold" aria-hidden="true" />
                {t('nav.createCourse')}
              </NavLink>
            )}
            {userToken && canAccessAdmin && (
              <NavLink
                to="/admin"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                <ShieldCheck size={15} weight="duotone" aria-hidden="true" />
                {t('nav.adminConsole')}
              </NavLink>
            )}
          </nav>

          <div className="mt-4 border-t border-[#CCFBF1] pt-4">
            {userToken ? (
              <div className="flex flex-col gap-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
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
                  onClick={handleLogout}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-sm font-medium text-[#DC2626]"
                >
                  <SignOut size={16} aria-hidden="true" className="rtl:rotate-180" />
                  {t('nav.signOut')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-3 py-2.5 text-center text-sm font-medium text-[#0D2E2F]"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-[#0D9488] px-3 py-2.5 text-center text-sm font-semibold text-white"
                >
                  {t('nav.createAccount')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
