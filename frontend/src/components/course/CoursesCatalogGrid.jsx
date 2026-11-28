import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle, Plus, Trash } from '@phosphor-icons/react';

const CARD_ACCENTS = [
  { topBar: 'bg-[#0D9488]', pill: 'bg-[#CCFBF1] text-[#0F766E]' },
  { topBar: 'bg-[#D97706]', pill: 'bg-[#FEF3C7] text-[#92400E]' },
  { topBar: 'bg-[#0284C7]', pill: 'bg-[#E0F2FE] text-[#0369A1]' },
  { topBar: 'bg-[#059669]', pill: 'bg-[#D1FAE5] text-[#065F46]' },
];

const getCourseCtaLabel = ({ userToken, isEnrolled, manageable, t }) => {
  if (!userToken) return t('home.signInToView');
  if (isEnrolled) return t('courses.continueLearning');
  if (manageable) return t('courses.manageCurriculum');
  return t('courses.openCourse');
};

const InstructorCredit = ({ instructor, t }) => {
  if (!instructor?.name) return null;
  return (
    <p className="mt-1 text-xs font-medium text-[#0F766E]">
      {t('courses.byInstructor', { name: instructor.name })}
    </p>
  );
};

const EmptyStateAction = ({ actionType, onBrowseAll, onClearSearch, t }) => {
  if (actionType === 'browseAll') {
    return (
      <button
        type="button"
        onClick={onBrowseAll}
        className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
      >
        {t('courses.browseAll')}
      </button>
    );
  }
  if (actionType === 'clearSearch') {
    return (
      <button
        type="button"
        onClick={onClearSearch}
        className="rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-4 py-2 text-sm font-medium text-[#0D2E2F] hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
      >
        {t('courses.clearSearch')}
      </button>
    );
  }
  if (actionType === 'createCourse') {
    return (
      <Link
        to="/course/new"
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
      >
        <Plus size={15} weight="bold" aria-hidden="true" />
        {t('nav.createCourse')}
      </Link>
    );
  }
  return null;
};

const CoursesEmptyState = ({ content, onBrowseAll, onClearSearch, t }) => (
  <div className="mt-8 rounded-2xl border border-[#99F6E4] bg-white p-12 text-center shadow-xs">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#CCFBF1] text-[#0D9488]">
      <BookOpen size={24} weight="duotone" aria-hidden="true" />
    </div>
    <h2 className="mt-4 font-display text-lg font-semibold text-[#0D2E2F]">
      {content.title}
    </h2>
    <p className="mx-auto mt-1.5 max-w-md text-sm text-[#335C5D]">
      {content.body}
    </p>
    <div className="mt-6 flex justify-center gap-3">
      <EmptyStateAction
        actionType={content.actionType}
        onBrowseAll={onBrowseAll}
        onClearSearch={onClearSearch}
        t={t}
      />
    </div>
  </div>
);

const CourseCatalogCard = ({
  course,
  idx,
  userToken,
  isEnrolled,
  manageable,
  onDelete,
  formatCount,
  t,
}) => {
  const id = course._id || course.id;
  const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0;
  const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
  const ctaLabel = getCourseCtaLabel({ userToken, isEnrolled, manageable, t });

  return (
    <article className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#0D9488] hover:shadow-md">
      <div>
        <div className={`h-1.5 w-full ${accent.topBar}`} />
        <div className="p-6">
          <div className="flex items-center justify-between gap-2">
            <span className={`rounded-md px-2.5 py-1 font-mono-tabular text-xs font-semibold ${accent.pill}`}>
              {formatCount(moduleCount, 'module')}
            </span>

            {isEnrolled && (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#D1FAE5] px-2.5 py-1 text-xs font-semibold text-[#065F46] ring-1 ring-[#A7F3D0]">
                <CheckCircle size={13} weight="fill" aria-hidden="true" />
                {t('courses.enrolledBadge')}
              </span>
            )}
          </div>

          <h2 className="mt-3 line-clamp-2 text-start font-display text-lg font-semibold leading-snug text-[#0D2E2F]">
            <bdi>{course.title}</bdi>
          </h2>
          <InstructorCredit instructor={course.instructor} t={t} />
          <p className="mt-2 line-clamp-3 text-start text-sm leading-relaxed text-[#335C5D]">
            <bdi>{course.description}</bdi>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#CCFBF1] bg-[#F0FDFA]/55 px-6 py-3">
        <Link
          to={`/course/${id}`}
          className="inline-flex min-h-[40px] items-center gap-1.5 py-1.5 text-sm font-semibold text-[#0F766E] hover:text-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
        >
          {ctaLabel}
          <ArrowRight size={15} weight="bold" aria-hidden="true" className="rtl:rotate-180" />
        </Link>

        {manageable && (
          <button
            type="button"
            onClick={() => onDelete(course)}
            aria-label={t('courses.deleteLabel', { title: course.title })}
            title={t('courses.deleteTitle')}
            className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg p-2 text-[#4A6F70] transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
          >
            <Trash size={17} aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
};

export const CoursesGrid = ({
  loading,
  displayedCourses,
  emptyContent,
  userToken,
  canManageFn,
  enrolledIds,
  onBrowseAll,
  onClearSearch,
  onDelete,
  formatCount,
  t,
}) => {
  if (loading && displayedCourses.length === 0) {
    return (
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-52 animate-pulse rounded-xl border border-[#99F6E4] bg-white p-6" />
        ))}
      </div>
    );
  }

  if (displayedCourses.length === 0) {
    return (
      <CoursesEmptyState
        content={emptyContent}
        onBrowseAll={onBrowseAll}
        onClearSearch={onClearSearch}
        t={t}
      />
    );
  }

  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {displayedCourses.map((course, idx) => {
        const id = course._id || course.id;
        return (
          <CourseCatalogCard
            key={id}
            course={course}
            idx={idx}
            userToken={userToken}
            isEnrolled={enrolledIds.includes(id)}
            manageable={canManageFn(course)}
            onDelete={onDelete}
            formatCount={formatCount}
            t={t}
          />
        );
      })}
    </div>
  );
};
