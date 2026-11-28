import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowsLeftRight, MagnifyingGlass, UsersThree, X } from '@phosphor-icons/react';
import { AdminPaginationBar } from './AdminPaginationBar';

const CourseActionButtons = ({ course, isSuperAdmin, onOpenEnrollments, onOpenTransfer, mobile = false, t }) => {
  const heightClass = mobile ? 'min-h-[44px] flex-1 justify-center px-3 py-2' : 'min-h-[36px] px-3 py-1.5';
  return (
    <div className={`flex flex-wrap items-center gap-2 ${mobile ? 'w-full' : 'justify-end'}`}>
      <button
        type="button"
        onClick={() => onOpenEnrollments(course)}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] text-xs font-semibold text-[#0F766E] hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${heightClass}`}
      >
        <UsersThree size={15} aria-hidden="true" />
        {t('admin.enrollmentsBtn')}
      </button>
      {isSuperAdmin && (
        <button
          type="button"
          onClick={() => onOpenTransfer(course)}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-[#FDE68A] bg-[#FEF3C7] text-xs font-semibold text-[#92400E] hover:bg-[#FDE68A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${heightClass}`}
        >
          <ArrowsLeftRight size={15} aria-hidden="true" />
          {t('admin.transferBtn')}
        </button>
      )}
    </div>
  );
};

const CourseRow = ({ course, isSuperAdmin, onOpenEnrollments, onOpenTransfer, t }) => (
  <tr className="hover:bg-[#F0FDFA]/50">
    <td className="px-4 py-3 text-start">
      <Link to={`/course/${course._id}`} className="font-semibold text-[#0D2E2F] hover:text-[#0F766E]">
        <bdi>{course.title}</bdi>
      </Link>
    </td>
    <td className="px-4 py-3 text-start">
      {course.instructor ? (
        <div>
          <p className="font-medium text-[#0D2E2F]">{course.instructor.name}</p>
          <p className="text-xs text-[#4A6F70]">
            <bdi dir="ltr">{course.instructor.email}</bdi>
          </p>
        </div>
      ) : (
        <span className="text-xs text-[#4A6F70]">—</span>
      )}
    </td>
    <td className="px-4 py-3 font-mono-tabular text-xs text-[#335C5D]">
      {course.moduleCount ?? 0} {t('admin.modulesShort')} · {course.enrollmentCount ?? 0} {t('admin.studentsShort')}
    </td>
    <td className="px-4 py-3 text-end">
      <CourseActionButtons
        course={course}
        isSuperAdmin={isSuperAdmin}
        onOpenEnrollments={onOpenEnrollments}
        onOpenTransfer={onOpenTransfer}
        t={t}
      />
    </td>
  </tr>
);

const CourseCard = ({ course, isSuperAdmin, onOpenEnrollments, onOpenTransfer, t }) => (
  <li className="space-y-3 p-4">
    <div className="text-start">
      <Link to={`/course/${course._id}`} className="font-semibold text-[#0D2E2F] hover:text-[#0F766E]">
        <bdi>{course.title}</bdi>
      </Link>
      {course.instructor && (
        <p className="mt-1 text-xs text-[#4A6F70]">
          {course.instructor.name} · <bdi dir="ltr">{course.instructor.email}</bdi>
        </p>
      )}
      <p className="mt-1.5 font-mono-tabular text-xs font-medium text-[#0F766E]">
        {course.moduleCount ?? 0} {t('admin.modulesShort')} · {course.enrollmentCount ?? 0} {t('admin.studentsShort')}
      </p>
    </div>
    <CourseActionButtons
      course={course}
      isSuperAdmin={isSuperAdmin}
      onOpenEnrollments={onOpenEnrollments}
      onOpenTransfer={onOpenTransfer}
      mobile
      t={t}
    />
  </li>
);

const CoursesTableSkeleton = () =>
  [1, 2, 3, 4, 5].map((i) => (
    <tr key={i} className="animate-pulse">
      <td className="px-4 py-3.5"><div className="h-4 w-48 rounded bg-[#CCFBF1]" /></td>
      <td className="px-4 py-3.5">
        <div className="h-4 w-28 rounded bg-[#CCFBF1]" />
        <div className="mt-1.5 h-3 w-36 rounded bg-[#E6F7F5]" />
      </td>
      <td className="px-4 py-3.5"><div className="h-4 w-24 rounded bg-[#CCFBF1]" /></td>
      <td className="px-4 py-3.5 text-end"><div className="ms-auto h-8 w-32 rounded-lg bg-[#CCFBF1]" /></td>
    </tr>
  ));

const CoursesTableBody = ({ courses, loading, isSuperAdmin, onOpenEnrollments, onOpenTransfer, t }) => {
  if (loading) return <CoursesTableSkeleton />;
  if (courses.length === 0) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-[#4A6F70]">{t('courses.emptyAllTitle')}</td>
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
  activeSearch,
  isSuperAdmin,
  onSearchInputChange,
  onSearchSubmit,
  onClearSearch,
  onPageChange,
  onOpenEnrollments,
  onOpenTransfer,
  t,
}) => (
  <div className="space-y-4">
    <div className="rounded-xl border border-[#99F6E4] bg-white p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={onSearchSubmit} className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] max-w-md flex-1">
            <MagnifyingGlass
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-[#4A6F70]"
            />
            <input
              type="text"
              aria-label={t('admin.searchCoursesAria')}
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder={t('courses.searchPlaceholder')}
              className="min-h-[44px] w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/50 py-2.5 ps-9 pe-3 text-sm text-[#0D2E2F] placeholder:text-[#4A6F70]/75 focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/25"
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            {t('courses.searchBtn')}
          </button>
        </form>

        <Link
          to="/course/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#0B3B3C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#114B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
        >
          {t('nav.createCourse')}
        </Link>
      </div>

      {activeSearch && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#CCFBF1] pt-3">
          <span className="text-xs font-medium text-[#4A6F70]">{t('admin.activeFiltersLabel')}</span>
          <button
            type="button"
            onClick={onClearSearch}
            className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-[#99F6E4] bg-[#F0FDFA] px-3 py-1 text-xs font-semibold text-[#0F766E] hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            <span>{t('common.activeSearch', { query: activeSearch })}</span>
            <X size={12} weight="bold" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>

    <div className="overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xs">
      <div className="hidden overflow-x-auto md:block" aria-busy={loading}>
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

      {loading ? (
        <ul role="status" aria-busy="true" aria-label={t('common.loading')} className="divide-y divide-[#CCFBF1] md:hidden">
          {[1, 2, 3].map((i) => (
            <li key={i} className="animate-pulse space-y-3 p-4">
              <div className="h-4 w-48 rounded bg-[#CCFBF1]" />
              <div className="h-3 w-36 rounded bg-[#E6F7F5]" />
              <div className="h-10 w-full rounded-lg bg-[#CCFBF1]" />
            </li>
          ))}
        </ul>
      ) : courses.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-[#4A6F70] md:hidden">{t('courses.emptyAllTitle')}</p>
      ) : (
        <ul className="divide-y divide-[#CCFBF1] md:hidden">
          {courses.map((c) => (
            <CourseCard
              key={c._id}
              course={c}
              isSuperAdmin={isSuperAdmin}
              onOpenEnrollments={onOpenEnrollments}
              onOpenTransfer={onOpenTransfer}
              t={t}
            />
          ))}
        </ul>
      )}

      <AdminPaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} t={t} />
    </div>
  </div>
);
