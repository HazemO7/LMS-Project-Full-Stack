import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { BrandMark } from './BrandMark';

export const AuthShell = ({ title, subtitle, asideTitle, asideBody, asidePoints = [], children }) => {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:items-start lg:py-16 lg:px-8">
      <div className="rounded-2xl border border-[#E2E8F0] bg-[#EEF1F6] p-8 lg:col-span-5 lg:p-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#475569] transition-colors hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Foundry
        </Link>

        <div className="mt-8">
          <BrandMark />
          <h2 className="mt-6 font-display text-2xl font-bold tracking-tight text-[#0F172A]">
            {asideTitle}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#475569]">{asideBody}</p>
        </div>

        {asidePoints.length > 0 && (
          <ul className="mt-8 space-y-3 border-t border-[#CBD5E1] pt-6">
            {asidePoints.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-[#334155]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1D4ED8]" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 lg:col-span-7 lg:p-10">
        <div className="mb-6 border-b border-[#E2E8F0] pb-5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-[#475569]">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
};
