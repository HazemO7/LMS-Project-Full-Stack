import React from 'react';
import { Link } from 'react-router-dom';
import { GithubLogo } from '@phosphor-icons/react';
import { useLanguage } from '../context/LanguageContext';
import { BrandMark } from './BrandMark';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[#1E6466] bg-[#0B3B3C] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link
              to="/"
              className="inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            >
              <BrandMark invert />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#CCFBF1]/85">
              {t('footer.tagline')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <div>
              <h3 className="text-xs font-semibold text-[#FBBF24]">{t('footer.platform')}</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-[#CCFBF1]">
                <li>
                  <Link to="/courses" className="transition-colors hover:text-[#FBBF24]">
                    {t('footer.catalog')}
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="transition-colors hover:text-[#FBBF24]">
                    {t('footer.settings')}
                  </Link>
                </li>
                <li>
                  <Link to="/course/new" className="transition-colors hover:text-[#FBBF24]">
                    {t('footer.publish')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[#FBBF24]">{t('footer.academy')}</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-[#CCFBF1]">
                <li>
                  <Link to="/about" className="transition-colors hover:text-[#FBBF24]">
                    {t('footer.about')}
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="transition-colors hover:text-[#FBBF24]">
                    {t('footer.contact')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-[#FBBF24]">{t('footer.access')}</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-[#CCFBF1]">
                <li>
                  <Link to="/login" className="transition-colors hover:text-[#FBBF24]">
                    {t('footer.signIn')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="transition-colors hover:text-[#FBBF24]">
                    {t('footer.createAccount')}
                  </Link>
                </li>
                <li>
                  <Link to="/forgot-password" className="transition-colors hover:text-[#FBBF24]">
                    {t('footer.resetPassword')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-[#1E6466] pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-[#99F6E4]/80">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <a
            href="https://github.com/HazemO7"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#CCFBF1] transition-colors hover:text-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
          >
            <GithubLogo size={16} aria-hidden="true" />
            {t('footer.builtBy')}
          </a>
        </div>
      </div>
    </footer>
  );
};
