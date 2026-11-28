import React from 'react';
import { BookOpen, ClipboardText, UserPlus } from '@phosphor-icons/react';
import { useLanguage } from '../../context/LanguageContext';

const KpiCard = ({ label, value, valueClass, sublabel }) => (
  <div className="rounded-xl border border-[#99F6E4] bg-white p-5 shadow-xs">
    <p className="text-xs font-semibold text-[#4A6F70]">{label}</p>
    <p className={`mt-2 font-mono-tabular text-3xl font-bold ${valueClass}`}>{value}</p>
    <p className="mt-1 text-xs text-[#335C5D]">{sublabel}</p>
  </div>
);

const StatsSkeletonGrid = ({ t }) => (
  <div role="status" aria-busy="true" aria-label={t('common.loading')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-28 animate-pulse rounded-xl border border-[#99F6E4] bg-white" />
    ))}
  </div>
);

const pct = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

const DistributionBar = ({ title, segments, ariaLabel }) => (
  <div className="space-y-2.5">
    <p className="text-xs font-semibold text-[#0D2E2F]">{title}</p>
    <div
      role="img"
      aria-label={ariaLabel}
      className="flex h-3 w-full overflow-hidden rounded-full bg-[#CCFBF1]"
    >
      {segments.map((seg) =>
        seg.pct > 0 ? (
          <div
            key={seg.key}
            className={`h-full transition-all duration-300 ${seg.barClass}`}
            style={{ width: `${seg.pct}%` }}
          />
        ) : null
      )}
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#335C5D]">
      {segments.map((seg) => (
        <span key={seg.key} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${seg.barClass}`} aria-hidden="true" />
          <span>{seg.label}:</span>
          <strong className="font-mono-tabular text-[#0D2E2F]">
            {seg.count} ({seg.pct}%)
          </strong>
        </span>
      ))}
    </div>
  </div>
);

const PlatformDistributionCard = ({ stats, t }) => {
  const totalUsers = stats.users.total || 0;
  const activeCount = stats.users.active || 0;
  const suspendedCount = stats.users.suspended || 0;
  const studentsCount = stats.users.students || 0;
  const instructorsCount = stats.users.instructors || 0;
  const adminsCount = (stats.users.admins || 0) + (stats.users.superAdmins || 0);

  const healthSegments = [
    { key: 'active', label: t('admin.statusActive'), count: activeCount, pct: pct(activeCount, totalUsers), barClass: 'bg-[#059669]' },
    { key: 'suspended', label: t('admin.statusSuspended'), count: suspendedCount, pct: pct(suspendedCount, totalUsers), barClass: 'bg-[#DC2626]' },
  ];

  const roleSegments = [
    { key: 'students', label: t('admin.kpiStudents'), count: studentsCount, pct: pct(studentsCount, totalUsers), barClass: 'bg-[#0F766E]' },
    { key: 'instructors', label: t('admin.kpiInstructors'), count: instructorsCount, pct: pct(instructorsCount, totalUsers), barClass: 'bg-[#F59E0B]' },
    { key: 'admins', label: t('role.admin'), count: adminsCount, pct: pct(adminsCount, totalUsers), barClass: 'bg-[#6366F1]' },
  ];

  return (
    <div className="rounded-2xl border border-[#99F6E4] bg-white p-6 shadow-xs">
      <h2 className="font-display text-lg font-semibold text-[#0D2E2F]">{t('admin.distributionTitle')}</h2>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <DistributionBar
          title={t('admin.accountHealth')}
          segments={healthSegments}
          ariaLabel={`${t('admin.accountHealth')}: ${activeCount}/${totalUsers}`}
        />
        <DistributionBar
          title={t('admin.roleDistribution')}
          segments={roleSegments}
          ariaLabel={`${t('admin.roleDistribution')}: ${studentsCount}/${instructorsCount}/${adminsCount}`}
        />
      </div>
    </div>
  );
};

export const AdminOverviewTab = ({ stats, statsLoading, isSuperAdmin, onOpenCreateStaff, onSelectTab }) => {
  const { t } = useLanguage();
  if (statsLoading) return <StatsSkeletonGrid t={t} />;
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

      <PlatformDistributionCard stats={stats} t={t} />

      <div className="rounded-2xl border border-[#99F6E4] bg-white p-6 shadow-xs">
        <h2 className="font-display text-lg font-semibold text-[#0D2E2F]">{t('admin.quickActionsTitle')}</h2>
        <p className="mt-1 text-sm text-[#335C5D]">{t('admin.quickActionsDesc')}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenCreateStaff}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#115E59]"
          >
            <UserPlus size={16} weight="bold" aria-hidden="true" />
            {t('admin.addInstructorCta')}
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('courses')}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-4 py-2.5 text-sm font-semibold text-[#0D2E2F] hover:bg-[#CCFBF1]"
          >
            <BookOpen size={16} weight="duotone" aria-hidden="true" />
            {t('admin.tabCourses')}
          </button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => onSelectTab('audit')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-4 py-2.5 text-sm font-semibold text-[#0D2E2F] hover:bg-[#CCFBF1]"
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
