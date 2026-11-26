import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowsLeftRight, MagnifyingGlass, UsersThree } from '@phosphor-icons/react';
import { AdminPaginationBar } from './AdminPaginationBar';

const CourseRow = ({ course, isSuperAdmin, onOpenEnrollments, onOpenTransfer, t }) => (
  <tr className="hover:bg-[#F0FDFA]/50">
    <td className="px-4 py-3">
      <Link to={`/course/${course._id}`} className="font-semibold text-[#0D2E2F] hover:text-[#0D9488]">
        {course.title}
      </Link>
    </td>
    <td className="px-4 py-3">
      {course.instructor ? (
        <div>
          <p className="font-medium text-[#0D2E2F]">{course.instructor.name}</p>
          <p dir="ltr" className="text-start text-xs text-[#52797A]">{course.instructor.email}</p>
        </div>
      ) : (
        <span className="text-xs text-[#52797A]">—</span>
      )}
    </td>
    <td className="px-4 py-3 font-mono-tabular text-xs text-[#335C5D]">
      {course.moduleCount ?? 0} {t('admin.modulesShort')} · {course.enrollmentCount ?? 0} {t('admin.studentsShort')}
    </td>
    <td className="px-4 py-3 text-end">
      <div className="inline-flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpenEnrollments(course)}
          className="inline-flex items-center gap-1 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-2.5 py-1.5 text-xs font-semibold text-[#0F766E] hover:bg-[#CCFBF1]"
        >
          <UsersThree size={14} aria-hidden="true" />
          {t('admin.enrollmentsBtn')}
        </button>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => onOpenTransfer(course)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-1.5 text-xs font-semibold text-[#92400E] hover:bg-[#FDE68A]"
          >
            <ArrowsLeftRight size={14} aria-hidden="true" />
            {t('admin.transferBtn')}
          </button>
        )}
      </div>
    </td>
  </tr>
);

const CoursesTableBody = ({ courses, loading, isSuperAdmin, onOpenEnrollments, onOpenTransfer, t }) => {
  if (loading) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-[#52797A]">{t('common.loading')}</td>
      </tr>
    );
  }
  if (courses.length === 0) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-[#52797A]">{t('courses.emptyAllTitle')}</td>
      </tr>
    );
  }
  return courses.map((c) => (
    <CourseRow
      key={c._id}
      course={c}
      isSuperAdmin={isSuperAdmin}
      onOpenEnrollments={onOpenEnrollments}
      onOpenTransfer={onOpenTransfer}
      t={t}
    />
  ));
};

export const AdminCoursesTab = ({
  courses,
  loading,
  page,
  totalPages,
  searchInput,
  isSuperAdmin,
  onSearchInputChange,
  onSearchSubmit,
  onPageChange,
  onOpenEnrollments,
  onOpenTransfer,
  t,
}) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#99F6E4] bg-white p-4 shadow-xs">
      <form onSubmit={onSearchSubmit} className="flex flex-1 items-center gap-2">
        <div className="relative max-w-md flex-1">
          <MagnifyingGlass
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-[#52797A]"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder={t('courses.searchPlaceholder')}
            className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/50 py-2 ps-9 pe-3 text-sm text-[#0D2E2F]"
          />
        </div>
        <button type="submit" className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]">
          {t('courses.searchBtn')}
        </button>
      </form>

      <Link to="/course/new" className="rounded-lg bg-[#0B3B3C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#114B4D]">
        {t('nav.createCourse')}
      </Link>
    </div>

    <div className="overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-start text-sm">
          <thead className="border-b border-[#CCFBF1] bg-[#F0FDFA] text-xs font-semibold text-[#0F766E]">
            <tr>
              <th className="px-4 py-3 text-start">{t('admin.colCourse')}</th>
              <th className="px-4 py-3 text-start">{t('admin.colInstructor')}</th>
              <th className="px-4 py-3 text-start">{t('admin.colMetrics')}</th>
              <th className="px-4 py-3 text-end">{t('admin.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#CCFBF1]">
            <CoursesTableBody
              courses={courses}
              loading={loading}
              isSuperAdmin={isSuperAdmin}
              onOpenEnrollments={onOpenEnrollments}
              onOpenTransfer={onOpenTransfer}
              t={t}
            />
          </tbody>
        </table>
      </div>
      <AdminPaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} t={t} />
    </div>
  </div>
);
