import React from 'react';
import { CornersIn, CornersOut, PencilSimple, Plus, SealCheck } from '@phosphor-icons/react';
import { Breadcrumb } from '../ui/Breadcrumb';

const InstructorByline = ({ instructor, t }) => {
  if (!instructor?.name) return null;
  const specialtySuffix = instructor.specialty ? ` · ${instructor.specialty}` : '';
  return (
    <p className="mt-1.5 text-start text-xs font-semibold text-[#FBBF24]">
      {t('courses.byInstructor', { name: instructor.name })}
      {specialtySuffix}
    </p>
  );
};

export const CourseHeader = ({
  course,
  canManage,
  accessDenied,
  progressData,
  completedCount,
  totalLessons,
  percentage,
  focusMode,
  onToggleFocusMode,
  onEditCourse,
  onAddModule,
  t,
}) => (
  <section className="ocean-grid-bg border-b border-[#1E6466] text-white">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Breadcrumb
          invert
          ariaLabel={t('nav.breadcrumbAria')}
          items={[
            { label: t('nav.home'), to: '/' },
            { label: t('nav.courses'), to: '/courses' },
            { label: course.title },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2">
          {!accessDenied && (
            <button
              type="button"
              aria-pressed={focusMode}
              onClick={onToggleFocusMode}
              className="hidden min-h-[40px] items-center gap-1.5 rounded-lg border border-[#2DD4BF]/50 bg-[#114B4D] px-3.5 py-2 text-xs font-semibold text-[#CCFBF1] hover:bg-[#155E61] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] lg:inline-flex"
            >
              {focusMode ? (
                <CornersIn size={15} aria-hidden="true" />
              ) : (
                <CornersOut size={15} aria-hidden="true" />
              )}
              {focusMode ? t('player.focusModeOff') : t('player.focusModeOn')}
            </button>
          )}

          {canManage && (
            <>
              <button
                type="button"
                onClick={onEditCourse}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#2DD4BF]/50 bg-[#114B4D] px-3.5 py-2 text-xs font-semibold text-[#CCFBF1] hover:bg-[#155E61] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
              >
                <PencilSimple size={15} aria-hidden="true" />
                {t('player.editCourse')}
              </button>
              <button
                type="button"
                onClick={onAddModule}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#F59E0B] px-3.5 py-2 text-xs font-bold text-[#0B3B3C] hover:bg-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]"
              >
                <Plus size={15} weight="bold" aria-hidden="true" />
                {t('player.addModule')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="text-start lg:col-span-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            <bdi>{course.title}</bdi>
          </h1>
          <InstructorByline instructor={course.instructor} t={t} />
          <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-[#CCFBF1]/90 sm:text-base">
            <bdi>{course.description}</bdi>
          </p>
        </div>

        {!accessDenied && progressData && (
          <div className="rounded-xl border border-[#1E6466] bg-[#114B4D] p-4 lg:col-span-4">
            <div className="flex items-center justify-between gap-2 text-xs font-medium">
              <span className="text-[#99F6E4]">{t('player.progressLabel')}</span>
              <span className="font-mono-tabular font-semibold text-[#FBBF24]">
                {completedCount}/{totalLessons} ({percentage}%)
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#0B3B3C]">
              <div
                className="h-full rounded-full bg-[#2DD4BF] transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            {percentage === 100 && totalLessons > 0 && (
              <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#6EE7B7]">
                <SealCheck size={15} weight="fill" aria-hidden="true" />
                {t('player.allCompleted')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  </section>
);
