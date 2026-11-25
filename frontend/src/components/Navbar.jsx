import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { List, Plus, SignOut, UserCircle, X } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { BrandMark } from './BrandMark';

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
    isActive
      ? 'bg-[#EEF1F6] text-[#0F172A]'
      : 'text-[#475569] hover:bg-[#F7F8FA] hover:text-[#0F172A]'
  }`;

export const Navbar = () => {
  const { userToken, currentUser, logoutUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const canCreateCourse =
    currentUser && (currentUser.role === 'admin' || currentUser.role === 'instructor');

  const handleLogout = () => {
    setMobileOpen(false);
    logoutUser();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/courses" className={navLinkClass}>
              Courses
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              Contact
            </NavLink>
            {userToken && canCreateCourse && (
              <NavLink to="/course/new" className={navLinkClass}>
                <Plus size={15} weight="bold" aria-hidden="true" />
                Create course
              </NavLink>
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {userToken ? (
            <>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F7F8FA] px-3 py-1.5 text-sm font-medium text-[#0F172A] transition-colors hover:border-[#CBD5E1] hover:bg-[#EEF1F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                <UserCircle size={18} weight="duotone" aria-hidden="true" className="text-[#1D4ED8]" />
                <span>{currentUser?.name || 'Profile'}</span>
                {currentUser?.role && (
                  <span className="rounded bg-white px-1.5 py-0.5 font-mono-tabular text-[11px] font-medium capitalize text-[#475569] ring-1 ring-[#E2E8F0]">
                    {currentUser.role}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm font-medium text-[#475569] transition-colors hover:border-[#FECACA] hover:bg-[#FEF2F2] hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                <SignOut size={16} aria-hidden="true" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#475569] transition-colors hover:bg-[#F7F8FA] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#0F172A] transition-colors hover:bg-[#F7F8FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] md:hidden"
        >
          {mobileOpen ? <X size={20} aria-hidden="true" /> : <List size={20} aria-hidden="true" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#E2E8F0] bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            <NavLink to="/" end className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/courses" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Courses
            </NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              About
            </NavLink>
            <NavLink to="/contact" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Contact
            </NavLink>
            {userToken && canCreateCourse && (
              <NavLink
                to="/course/new"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                <Plus size={15} weight="bold" aria-hidden="true" />
                Create course
              </NavLink>
            )}
          </nav>

          <div className="mt-4 border-t border-[#E2E8F0] pt-4">
            {userToken ? (
              <div className="flex flex-col gap-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F7F8FA] px-3 py-2.5 text-sm font-medium text-[#0F172A]"
                >
                  <span className="inline-flex items-center gap-2">
                    <UserCircle size={18} weight="duotone" aria-hidden="true" className="text-[#1D4ED8]" />
                    {currentUser?.name || 'Profile'}
                  </span>
                  {currentUser?.role && (
                    <span className="rounded bg-white px-2 py-0.5 font-mono-tabular text-xs capitalize text-[#475569] ring-1 ring-[#E2E8F0]">
                      {currentUser.role}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-sm font-medium text-[#DC2626]"
                >
                  <SignOut size={16} aria-hidden="true" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg border border-[#CBD5E1] px-3 py-2.5 text-center text-sm font-medium text-[#0F172A]"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-[#1D4ED8] px-3 py-2.5 text-center text-sm font-medium text-white"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
