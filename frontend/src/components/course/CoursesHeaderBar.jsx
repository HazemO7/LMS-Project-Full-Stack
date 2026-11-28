import React from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlass, Plus, X } from '@phosphor-icons/react';
import { resolveTabFromKey } from './useCoursesCatalog';

const CoursesSearchForm = ({ searchInput, searchQuery, onInputChange, onSubmit, onClear, t }) => (
  <form onSubmit={onSubmit} className="flex items-center gap-2">
    <div className="relative min-w-[220px] flex-1">
      <MagnifyingGlass
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-[#99F6E4]"
      />
      <input
        type="text"
        aria-label={t('courses.searchAria')}
        placeholder={t('courses.searchPlaceholder')}
        value={searchInput}
        onChange={(e) => onInputChange(e.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-[#2DD4BF]/40 bg-[#114B4D] py-2.5 ps-9 pe-10 text-sm text-white placeholder:text-[#99F6E4]/65 focus:border-[#F59E0B] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/30"
      />
      {(searchInput || searchQuery) && (
        <button
          type="button"
          onClick={onClear}
          aria-label={t('courses.clearSearch')}
          className="absolute top-1/2 end-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-[#99F6E4] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
    <button
      type="submit"
      className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#2DD4BF]/50 bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
    >
      {t('courses.searchBtn')}
    </button>
  </form>
);

export const CoursesHeader = ({
  activeTab,
  searchInput,
  searchQuery,
  canCreate,
  onInputChange,
  onSearch,
  onClearSearch,
  t,
}) => {
  const titleKey = activeTab === 'enrolled' ? 'courses.enrolledTitle' : 'courses.catalogTitle';
  const subKey = activeTab === 'enrolled' ? 'courses.enrolledSubtitle' : 'courses.catalogSubtitle';

  return (
    <section className="ocean-grid-bg border-b border-[#1E6466] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-12 lg:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t(titleKey)}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#CCFBF1]/90">{t(subKey)}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {activeTab === 'all' && (
              <CoursesSearchForm
                searchInput={searchInput}
                searchQuery={searchQuery}
                onInputChange={onInputChange}
                onSubmit={onSearch}
                onClear={onClearSearch}
                t={t}
              />
            )}

            {canCreate && (
              <Link
                to="/course/new"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-sm font-bold text-[#0B3B3C] transition-colors hover:bg-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]"
              >
                <Plus size={16} weight="bold" aria-hidden="true" />
                {t('nav.createCourse')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const StudentTabButtons = ({ activeTab, enrolledCount, onTabChange, t }) => {
  const handleTabKeyDown = (e) => {
    const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const targetTab = resolveTabFromKey(e.key, activeTab, isRtl);
    if (!targetTab) return;
    e.preventDefault();
    onTabChange(targetTab);
    document.getElementById(targetTab === 'all' ? 'tab-all' : 'tab-enrolled')?.focus();
  };

  const tabClass = (isSelected) =>
    `min-h-[40px] rounded-md px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
      isSelected ? 'bg-[#0F766E] text-white' : 'text-[#335C5D] hover:text-[#0B3B3C]'
    }`;

  const badgeClass =
    activeTab === 'enrolled' ? 'bg-[#F59E0B] text-[#0B3B3C]' : 'bg-[#FEF3C7] text-[#92400E]';

  return (
    <div
      role="tablist"
      aria-label={t('courses.viewsAria')}
      onKeyDown={handleTabKeyDown}
      className="inline-flex rounded-lg border border-[#99F6E4] bg-white p-1 shadow-xs"
    >
      <button
        id="tab-all"
        type="button"
        role="tab"
        aria-selected={activeTab === 'all'}
        aria-controls="courses-tabpanel"
        onClick={() => onTabChange('all')}
        className={tabClass(activeTab === 'all')}
      >
        {t('courses.tabAll')}
      </button>
      <button
        id="tab-enrolled"
        type="button"
        role="tab"
        aria-selected={activeTab === 'enrolled'}
        aria-controls="courses-tabpanel"
        onClick={() => onTabChange('enrolled')}
        className={`inline-flex items-center gap-1.5 ${tabClass(activeTab === 'enrolled')}`}
      >
        {t('courses.tabEnrolled')}
        <span className={`rounded px-1.5 py-0.5 font-mono-tabular text-[11px] font-bold ${badgeClass}`}>
          {enrolledCount}
        </span>
      </button>
    </div>
  );
};

export const CoursesTabsBar = ({ isStudent, activeTab, enrolledCount, summaryText, onTabChange, t }) => (
  <div className="flex flex-wrap items-center justify-between gap-4">
    {isStudent ? (
      <StudentTabButtons
        activeTab={activeTab}
        enrolledCount={enrolledCount}
        onTabChange={onTabChange}
        t={t}
      />
    ) : (
      <div />
    )}

    <p className="rounded-full bg-[#CCFBF1] px-3 py-1 font-mono-tabular text-xs font-semibold text-[#0F766E]">
      {summaryText}
    </p>
  </div>
);

export const ActiveSearchChip = ({ searchQuery, onClear, t }) => {
  if (!searchQuery) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-[#4A6F70]">{t('admin.activeFiltersLabel')}</span>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full border border-[#99F6E4] bg-white px-3 py-1 text-xs font-semibold text-[#0F766E] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
      >
        <span>{t('common.activeSearch', { query: searchQuery })}</span>
        <X size={13} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
};
