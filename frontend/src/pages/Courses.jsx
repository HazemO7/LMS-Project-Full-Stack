import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  MagnifyingGlass,
  Plus,
  Trash,
  X,
} from '@phosphor-icons/react';
import { coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { canAuthorCourses, canManageCourse } from '../utils/roleUtils';
import { AlertBanner } from '../components/ui/AlertBanner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';

const CARD_ACCENTS = [
  { topBar: 'bg-[#0D9488]', pill: 'bg-[#CCFBF1] text-[#0F766E]' },
  { topBar: 'bg-[#D97706]', pill: 'bg-[#FEF3C7] text-[#92400E]' },
  { topBar: 'bg-[#0284C7]', pill: 'bg-[#E0F2FE] text-[#0369A1]' },
  { topBar: 'bg-[#059669]', pill: 'bg-[#D1FAE5] text-[#065F46]' },
];

const buildCatalogParams = (nextTab, nextPage, nextQuery) => {
  const params = {};
  if (nextTab === 'enrolled') params.tab = 'enrolled';
  if (nextPage > 1 && nextTab !== 'enrolled') params.page = String(nextPage);
  if (nextQuery && nextTab !== 'enrolled') params.q = nextQuery;
  return params;
};

const resolveTabFromKey = (key, activeTab, isRtl) => {
  if (key === 'Home') return 'all';
  if (key === 'End') return 'enrolled';
  const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
  const prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
  if (key === nextKey && activeTab === 'all') return 'enrolled';
  if (key === prevKey && activeTab === 'enrolled') return 'all';
  return null;
};

const getCourseCtaLabel = ({ userToken, isEnrolled, manageable, t }) => {
  if (!userToken) return t('home.signInToView');
  if (isEnrolled) return t('courses.continueLearning');
  if (manageable) return t('courses.manageCurriculum');
  return t('courses.openCourse');
};

const getCatalogSummaryText = ({
  loading,
  hasDisplayed,
  activeTab,
  enrolledCount,
  searchQuery,
  catalogCountLabel,
  t,
}) => {
  if (loading && !hasDisplayed) return t('courses.loadingCount');
  if (activeTab === 'enrolled') return t('courses.enrolledCount', { count: enrolledCount });
  if (searchQuery) {
    return t('courses.catalogCountMatching', { label: catalogCountLabel, query: searchQuery });
  }
  return catalogCountLabel;
};

const getEmptyStateContent = ({ activeTab, searchQuery, canCreate, t }) => {
  if (activeTab === 'enrolled') {
    return {
      title: t('courses.emptyEnrolledTitle'),
      body: t('courses.emptyEnrolledBody'),
      actionType: 'browseAll',
    };
  }
  if (searchQuery) {
    return {
      title: t('courses.emptySearchTitle'),
      body: t('courses.emptySearchBody'),
      actionType: 'clearSearch',
    };
  }
  return {
    title: t('courses.emptyAllTitle'),
    body: canCreate ? t('courses.emptyAllBodyAdmin') : t('courses.emptyAllBodyStudent'),
    actionType: canCreate ? 'createCourse' : 'none',
  };
};

const useCatalogState = (isStudent) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const initialQuery = searchParams.get('q') || '';
  const initialTab = searchParams.get('tab') === 'enrolled' ? 'enrolled' : 'all';

  const [tab, setTab] = useState(initialTab);
  const [page, setPage] = useState(initialPage);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const activeTab = isStudent ? tab : 'all';

  const syncUrlParams = useCallback(
    (nextTab, nextPage, nextQuery) => {
      setSearchParams(buildCatalogParams(nextTab, nextPage, nextQuery), { replace: true });
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (!isStudent && searchParams.get('tab') === 'enrolled') {
      syncUrlParams('all', page, searchQuery);
    }
  }, [isStudent, searchParams, page, searchQuery, syncUrlParams]);

  useEffect(() => {
    if (activeTab !== 'all') return undefined;
    const trimmed = searchInput.trim();
    if (trimmed === searchQuery) return undefined;
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearchQuery(trimmed);
      syncUrlParams('all', 1, trimmed);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [activeTab, searchInput, searchQuery, syncUrlParams]);

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    syncUrlParams(nextTab, page, searchQuery);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    setPage(1);
    setSearchQuery(trimmed);
    syncUrlParams('all', 1, trimmed);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
    syncUrlParams('all', 1, '');
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    syncUrlParams(activeTab, nextPage, searchQuery);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    activeTab,
    page,
    searchInput,
    setSearchInput,
    searchQuery,
    handleTabChange,
    handleSearch,
    clearSearch,
    handlePageChange,
  };
};

const useCatalogData = ({ userToken, isStudent, page, searchQuery }) => {
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await coursesAPI.getAll(page, 6, searchQuery);
      const list = Array.isArray(data) ? data : data.courses || data.data || [];
      setCourses(list);
      setTotalPages(data.totalPages || 1);
      setTotalCourses(data.totalCourses ?? list.length);
    } catch (err) {
      setError(err.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  const fetchMyCourses = useCallback(async () => {
    if (!userToken || !isStudent) {
      setMyCourses([]);
      setEnrolledIds([]);
      return;
    }
    try {
      const res = await coursesAPI.getMyCourses();
      const enrollments = Array.isArray(res?.data) ? res.data : [];
      const enrolledList = enrollments.map((item) => item.course).filter(Boolean);
      setMyCourses(enrolledList);
      setEnrolledIds(enrolledList.map((c) => c._id || c.id));
    } catch {
      // Do not block catalog rendering if enrollment lookup fails
    }
  }, [userToken, isStudent]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);

  const removeCourseFromState = (id) => {
    setCourses((prev) => prev.filter((c) => (c._id || c.id) !== id));
    setMyCourses((prev) => prev.filter((c) => (c._id || c.id) !== id));
    setTotalCourses((prev) => Math.max(0, prev - 1));
  };

  return {
    courses,
    enrolledIds,
    myCourses,
    loading,
    error,
    setError,
    totalPages,
    totalCourses,
    removeCourseFromState,
  };
};

const InstructorCredit = ({ instructor, t }) => {
  if (!instructor?.name) return null;
  return (
    <p className="mt-1 text-xs font-medium text-[#0F766E]">
      {t('courses.byInstructor', { name: instructor.name })}
    </p>
  );
};

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

const CoursesHeader = ({
  activeTab,
  searchInput,
  searchQuery,
  canCreate,
  onInputChange,
  onSearch,
  onClearSearch,
  t,
}) => (
  <section className="ocean-grid-bg border-b border-[#1E6466] text-white">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-12 lg:px-8">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {activeTab === 'enrolled' ? t('courses.enrolledTitle') : t('courses.catalogTitle')}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#CCFBF1]/90">
            {activeTab === 'enrolled' ? t('courses.enrolledSubtitle') : t('courses.catalogSubtitle')}
          </p>
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

const StudentTabButtons = ({ activeTab, enrolledCount, onTabChange, t }) => {
  const handleTabKeyDown = (e) => {
    const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const targetTab = resolveTabFromKey(e.key, activeTab, isRtl);
    if (!targetTab) return;
    e.preventDefault();
    onTabChange(targetTab);
    document.getElementById(targetTab === 'all' ? 'tab-all' : 'tab-enrolled')?.focus();
  };

  const activeBtn = 'bg-[#0F766E] text-white';
  const idleBtn = 'text-[#335C5D] hover:text-[#0B3B3C]';

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
        className={`min-h-[40px] rounded-md px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
          activeTab === 'all' ? activeBtn : idleBtn
        }`}
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
        className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
          activeTab === 'enrolled' ? activeBtn : idleBtn
        }`}
      >
        {t('courses.tabEnrolled')}
        <span
          className={`rounded px-1.5 py-0.5 font-mono-tabular text-[11px] font-bold ${
            activeTab === 'enrolled' ? 'bg-[#F59E0B] text-[#0B3B3C]' : 'bg-[#FEF3C7] text-[#92400E]'
          }`}
        >
          {enrolledCount}
        </span>
      </button>
    </div>
  );
};

const CoursesTabsBar = ({ isStudent, activeTab, enrolledCount, summaryText, onTabChange, t }) => (
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

const ActiveSearchChip = ({ searchQuery, onClear, t }) => {
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

const CoursesGrid = ({
  loading,
  displayedCourses,
  emptyContent,
  userToken,
  currentUser,
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
            manageable={canManageCourse(currentUser, course)}
            onDelete={onDelete}
            formatCount={formatCount}
            t={t}
          />
        );
      })}
    </div>
  );
};

export const Courses = () => {
  const { userToken, currentUser } = useAuth();
  const { t, formatCount, tServer } = useLanguage();
  const isStudent = currentUser?.role === 'student';
  const canCreate = canAuthorCourses(currentUser);

  const catalog = useCatalogState(isStudent);
  const data = useCatalogData({
    userToken,
    isStudent,
    page: catalog.page,
    searchQuery: catalog.searchQuery,
  });

  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    const id = courseToDelete._id || courseToDelete.id;
    setDeleting(true);
    data.setError('');
    try {
      await coursesAPI.delete(id);
      data.removeCourseFromState(id);
      setCourseToDelete(null);
    } catch (err) {
      data.setError(err.message || 'Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const displayedCourses = catalog.activeTab === 'enrolled' ? data.myCourses : data.courses;
  const summaryText = getCatalogSummaryText({
    loading: data.loading,
    hasDisplayed: displayedCourses.length > 0,
    activeTab: catalog.activeTab,
    enrolledCount: data.myCourses.length,
    searchQuery: catalog.searchQuery,
    catalogCountLabel: formatCount(data.totalCourses, 'course'),
    t,
  });
  const emptyContent = getEmptyStateContent({
    activeTab: catalog.activeTab,
    searchQuery: catalog.searchQuery,
    canCreate,
    t,
  });

  return (
    <div>
      <CoursesHeader
        activeTab={catalog.activeTab}
        searchInput={catalog.searchInput}
        searchQuery={catalog.searchQuery}
        canCreate={canCreate}
        onInputChange={catalog.setSearchInput}
        onSearch={catalog.handleSearch}
        onClearSearch={catalog.clearSearch}
        t={t}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10 lg:px-8">
        <CoursesTabsBar
          isStudent={isStudent}
          activeTab={catalog.activeTab}
          enrolledCount={data.myCourses.length}
          summaryText={summaryText}
          onTabChange={catalog.handleTabChange}
          t={t}
        />

        {catalog.activeTab === 'all' && (
          <ActiveSearchChip searchQuery={catalog.searchQuery} onClear={catalog.clearSearch} t={t} />
        )}

        {data.error && (
          <AlertBanner variant="error" className="mt-6" onDismiss={() => data.setError('')}>
            {tServer(data.error)}
          </AlertBanner>
        )}

        <div
          id="courses-tabpanel"
          role={isStudent ? 'tabpanel' : undefined}
          aria-labelledby={
            isStudent ? (catalog.activeTab === 'enrolled' ? 'tab-enrolled' : 'tab-all') : undefined
          }
        >
          <CoursesGrid
            loading={data.loading}
            displayedCourses={displayedCourses}
            emptyContent={emptyContent}
            userToken={userToken}
            currentUser={currentUser}
            enrolledIds={data.enrolledIds}
            onBrowseAll={() => catalog.handleTabChange('all')}
            onClearSearch={catalog.clearSearch}
            onDelete={setCourseToDelete}
            formatCount={formatCount}
            t={t}
          />
        </div>

        {catalog.activeTab === 'all' && (
          <Pagination
            page={catalog.page}
            totalPages={data.totalPages}
            onPageChange={catalog.handlePageChange}
            ariaLabel={t('courses.paginationAria')}
            prevLabel={t('courses.prev')}
            nextLabel={t('courses.next')}
            pageOfLabel={t('courses.pageOf', { page: catalog.page, total: data.totalPages })}
            className="mt-10"
          />
        )}

        <ConfirmDialog
          open={Boolean(courseToDelete)}
          onClose={() => !deleting && setCourseToDelete(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
          title={t('courses.deleteTitle')}
          message={courseToDelete ? t('courses.deleteMsg', { title: courseToDelete.title }) : ''}
          confirmLabel={t('courses.deleteConfirm')}
        />
      </div>
    </div>
  );
};
