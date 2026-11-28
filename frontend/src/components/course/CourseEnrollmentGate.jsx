import React from 'react';
import { ArrowRight, BookOpen, LockKey } from '@phosphor-icons/react';

export const CourseEnrollmentGate = ({
  isStudent,
  enrolling,
  onEnroll,
  moduleCount = 0,
  formatCount,
  t,
}) => (
  <div className="rounded-2xl border border-[#99F6E4] bg-white p-8 text-center shadow-xs sm:p-12">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706]">
      <LockKey size={24} weight="duotone" aria-hidden="true" />
    </div>
    <h2 className="mt-4 font-display text-2xl font-bold text-[#0D2E2F]">
      {isStudent ? t('player.enrollGateTitle') : t('player.staffGateTitle')}
    </h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#335C5D]">
      {isStudent ? t('player.enrollGateBody') : t('player.enrollStudentOnly')}
    </p>
    {moduleCount > 0 && formatCount && (
      <div className="mt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#CCFBF1] px-3 py-1 font-mono-tabular text-xs font-semibold text-[#0F766E]">
          <BookOpen size={14} weight="duotone" aria-hidden="true" />
          {formatCount(moduleCount, 'module')}
        </span>
      </div>
    )}
    {isStudent && (
      <button
        type="button"
        onClick={onEnroll}
        disabled={enrolling}
        className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#0F766E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {enrolling ? t('player.enrolling') : t('player.enrollBtn')}
        <ArrowRight size={16} weight="bold" aria-hidden="true" className="rtl:rotate-180" />
      </button>
    )}
  </div>
);
