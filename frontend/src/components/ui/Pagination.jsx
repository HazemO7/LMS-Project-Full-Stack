import React from 'react';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';

/**
 * Shared accessible pagination bar with 44px touch targets and RTL-mirrored arrows.
 */
export const Pagination = ({
  page,
  totalPages,
  onPageChange,
  ariaLabel,
  prevLabel,
  nextLabel,
  pageOfLabel,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className={`flex flex-wrap items-center justify-center gap-3 ${className}`}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-medium text-[#0D2E2F] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:cursor-not-allowed disabled:opacity-45"
      >
        <ArrowLeft size={15} aria-hidden="true" className="rtl:rotate-180" />
        {prevLabel}
      </button>

      <span className="font-mono-tabular inline-flex min-h-[44px] items-center rounded-lg bg-white px-3.5 py-2 text-xs font-semibold text-[#0F766E] ring-1 ring-[#99F6E4]">
        {pageOfLabel}
      </span>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-medium text-[#0D2E2F] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {nextLabel}
        <ArrowRight size={15} aria-hidden="true" className="rtl:rotate-180" />
      </button>
    </nav>
  );
};
