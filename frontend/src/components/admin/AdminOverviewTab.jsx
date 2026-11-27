import React from 'react';
import { BookOpen, ClipboardText, UserPlus } from '@phosphor-icons/react';
import { useLanguage } from '../../context/LanguageContext';

const KpiCard = ({ label, value, valueClass, sublabel }) => (
  <div className="rounded-xl border border-[#99F6E4] bg-white p-5 shadow-xs">
    <p className="text-xs font-semibold text-[#52797A]">{label}</p>
    <p className={`mt-2 font-mono-tabular text-3xl font-bold ${valueClass}`}>{value}</p>
    <p className="mt-1 text-xs text-[#335C5D]">{sublabel}</p>
  </div>
);

const StatsSkeletonGrid = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-28 animate-pulse rounded-xl border border-[#99F6E4] bg-white" />
    ))}
  </div>
);

export const AdminOverviewTab = ({ stats, statsLoading, isSuperAdmin, onOpenCreateStaff, onSelectTab }) => {
  const { t } = useLanguage();
  if (statsLoading) return <StatsSkeletonGrid />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t('admin.kpiUsers')}
          value={stats.users.total}
          valueClass="text-[#0D2E2F]"
          sublabel={t('admin.kpiActiveSuspended', { active: stats.users.active, suspended: stats.users.suspended })}
        />
        <KpiCard
          label={t('admin.kpiInstructors')}
          value={stats.users.instructors}
          valueClass="text-[#D97706]"
          sublabel={t('admin.kpiAdminsCount', { count: stats.users.admins + stats.users.superAdmins })}
        />
        <KpiCard
          label={t('admin.kpiStudents')}
          value={stats.users.students}
          valueClass="text-[#059669]"
          sublabel={t('admin.kpiEnrollments', { count: stats.enrollments.total })}
        />
        <KpiCard
          label={t('admin.kpiCourses')}
          value={stats.courses.total}
          valueClass="text-[#0284C7]"
          sublabel={t('admin.kpiLessons', { count: stats.lessons.total })}
        />
      </div>

      <div className="rounded-2xl border border-[#99F6E4] bg-white p-6 shadow-xs">
        <h2 className="font-display text-lg font-semibold text-[#0D2E2F]">{t('admin.quickActionsTitle')}</h2>
        <p className="mt-1 text-sm text-[#335C5D]">{t('admin.quickActionsDesc')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenCreateStaff}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]"
          >
            <UserPlus size={16} weight="bold" aria-hidden="true" />
            {t('admin.addInstructorCta')}
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('courses')}
            className="inline-flex items-center gap-2 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-4 py-2 text-sm font-semibold text-[#0D2E2F] hover:bg-[#CCFBF1]"
          >
            <BookOpen size={16} weight="duotone" aria-hidden="true" />
            {t('admin.tabCourses')}
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => onSelectTab('audit')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-4 py-2 text-sm font-semibold text-[#0D2E2F] hover:bg-[#CCFBF1]"
            >
              <ClipboardText size={16} weight="duotone" aria-hidden="true" />
              {t('admin.tabAudit')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
