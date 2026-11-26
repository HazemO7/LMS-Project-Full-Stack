import React from 'react';

export const AdminPaginationBar = ({ page, totalPages, onPageChange, t }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-[#CCFBF1] px-4 py-3 text-xs">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        className="rounded-lg border border-[#99F6E4] px-3 py-1.5 font-semibold text-[#0D2E2F] disabled:opacity-40"
      >
        {t('courses.prev')}
      </button>
      <span className="font-mono-tabular font-semibold text-[#0F766E]">
        {t('courses.pageOf', { page, total: totalPages })}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        className="rounded-lg border border-[#99F6E4] px-3 py-1.5 font-semibold text-[#0D2E2F] disabled:opacity-40"
      >
        {t('courses.next')}
      </button>
    </div>
  );
};
