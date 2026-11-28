import React from 'react';
import { Pagination } from '../ui/Pagination';

export const AdminPaginationBar = ({ page, totalPages, onPageChange, t }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="border-t border-[#CCFBF1] px-4 py-3">
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        ariaLabel={t('admin.paginationAria')}
        prevLabel={t('courses.prev')}
        nextLabel={t('courses.next')}
        pageOfLabel={t('courses.pageOf', { page, total: totalPages })}
      />
    </div>
  );
};
