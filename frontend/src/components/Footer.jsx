import React from 'react';
import { Link } from 'react-router-dom';
import { GithubLogo } from '@phosphor-icons/react';
import { BrandMark } from './BrandMark';

export const Footer = () => {
  return (
    <footer className="border-t border-[#E2E8F0] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link
              to="/"
              className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              <BrandMark />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#475569]">
              Structured technical courses, module-based authoring, and verified lesson progress tracking in a calm study workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <div>
              <h3 className="text-xs font-semibold text-[#0F172A]">Platform</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-[#475569]">
                <li>
                  <Link to="/courses" className="hover:text-[#0F172A]">
                    Course catalog
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-[#0F172A]">
                    Account settings
                  </Link>
                </li>
                <li>
                  <Link to="/course/new" className="hover:text-[#0F172A]">
                    Publish a course
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[#0F172A]">Academy</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-[#475569]">
                <li>
                  <Link to="/about" className="hover:text-[#0F172A]">
                    About Foundry
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#0F172A]">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[#0F172A]">Access</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-[#475569]">
                <li>
                  <Link to="/login" className="hover:text-[#0F172A]">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-[#0F172A]">
                    Create account
                  </Link>
                </li>
                <li>
                  <Link to="/forgot-password" className="hover:text-[#0F172A]">
                    Reset password
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[#E2E8F0] pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-[#64748B]">
            © {new Date().getFullYear()} Foundry Learning Management System.
          </p>
          <a
            href="https://github.com/HazemO7/LMS-Project-Full-Stack"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#475569] transition-colors hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <GithubLogo size={16} aria-hidden="true" />
            Source repository
          </a>
        </div>
      </div>
    </footer>
  );
};
