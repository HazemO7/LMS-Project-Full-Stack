import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { useLanguage } from '../context/LanguageContext';
import { BrandMark } from './BrandMark';

export const AuthShell = ({ title, subtitle, asideTitle, asideBody, asidePoints = [], children }) => {
  const { t } = useLanguage();

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:items-start lg:py-16 lg:px-8">
      <div className="ocean-grid-bg rounded-2xl border border-[#1E6466] p-8 text-white shadow-lg lg:col-span-5 lg:p-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#99F6E4] transition-colors hover:text-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
        >
          <ArrowLeft size={14} aria-hidden="true" className="rtl:rotate-180" />
          {t('auth.backHome')}
        </Link>

        <div className="mt-8">
          <BrandMark invert />
          <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-white">
            {asideTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#CCFBF1]/90">{asideBody}</p>
        </div>

        {asidePoints.length > 0 && (
          <ul className="mt-8 space-y-3 border-t border-[#1E6466] pt-6">
            {asidePoints.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-[#CCFBF1]">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#F59E0B]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#99F6E4] bg-white shadow-sm lg:col-span-7">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0D9488] to-[#F59E0B]" />
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-6 border-b border-[#CCFBF1] pb-5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0D2E2F] sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-[#335C5D]">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
