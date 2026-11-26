import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
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
import { AlertBanner } from '../components/ui/AlertBanner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const CARD_ACCENTS = [
  { topBar: 'bg-[#0D9488]', pill: 'bg-[#CCFBF1] text-[#0F766E]' },
  { topBar: 'bg-[#D97706]', pill: 'bg-[#FEF3C7] text-[#92400E]' },
  { topBar: 'bg-[#0284C7]', pill: 'bg-[#E0F2FE] text-[#0369A1]' },
  { topBar: 'bg-[#059669]', pill: 'bg-[#D1FAE5] text-[#065F46]' },
];

export const Courses = () => {
  const { userToken, currentUser } = useAuth();
  const { t, formatCount, tServer } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const initialQuery = searchParams.get('q') || '';
  const initialTab = searchParams.get('tab') === 'enrolled' ? 'enrolled' : 'all';

  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 6;
  const isStudent = currentUser?.role === 'student';
  const canCreate =
    currentUser?.role === 'admin' || currentUser?.role === 'instructor';

  const syncUrlParams = useCallback(
    (nextTab, nextPage, nextQuery) => {
      const params = {};
      if (nextTab === 'enrolled') params.tab = 'enrolled';
      if (nextPage > 1 && nextTab !== 'enrolled') params.page = String(nextPage);
      if (nextQuery && nextTab !== 'enrolled') params.q = nextQuery;
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await coursesAPI.getAll(page, limit, searchQuery);
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
      const enrolledList = enrollments
        .map((enrollment) => enrollment.course)
        .filter(Boolean);
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

  useEffect(() => {
    if (!isStudent && activeTab === 'enrolled') {
      setActiveTab('all');
      syncUrlParams('all', page, searchQuery);
    }
  }, [isStudent, activeTab, page, searchQuery, syncUrlParams]);

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    syncUrlParams(nextTab, page, searchQuery);
  };

  const handleTabKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      handleTabChange(activeTab === 'all' ? 'enrolled' : 'all');
    }
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

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    const id = courseToDelete._id || courseToDelete.id;
    setDeleting(true);
    setError('');
    try {
      await coursesAPI.delete(id);
      setCourses((prev) => prev.filter((c) => (c._id || c.id) !== id));
      setMyCourses((prev) => prev.filter((c) => (c._id || c.id) !== id));
      setTotalCourses((prev) => Math.max(0, prev - 1));
      setCourseToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const displayedCourses = activeTab === 'enrolled' ? myCourses : courses;

  const canManageCourse = (course) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return (
      currentUser.role === 'instructor' &&
      course.instructor &&
      (course.instructor._id || course.instructor) === currentUser._id
    );
  };

  const catalogCountLabel = formatCount(totalCourses, 'course');

  return (
    <div>
      {/* Ocean Header Band */}
      <section className="ocean-grid-bg border-b border-[#1E6466] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-12 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {activeTab === 'enrolled'
                  ? t('courses.enrolledTitle')
                  : t('courses.catalogTitle')}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[#CCFBF1]/90">
                {activeTab === 'enrolled'
                  ? t('courses.enrolledSubtitle')
                  : t('courses.catalogSubtitle')}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {activeTab === 'all' && (
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <div className="relative min-w-[240px] flex-1">
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
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full rounded-lg border border-[#2DD4BF]/40 bg-[#114B4D] py-2 ps-9 pe-9 text-sm text-white placeholder:text-[#99F6E4]/65 focus:border-[#F59E0B] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/30"
                    />
                    {(searchInput || searchQuery) && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        aria-label={t('courses.clearSearch')}
                        className="absolute top-1/2 end-2.5 -translate-y-1/2 rounded p-0.5 text-[#99F6E4] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg border border-[#2DD4BF]/50 bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#14B8A6] hover:text-[#0B3B3C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                  >
                    {t('courses.searchBtn')}
                  </button>
                </form>
              )}

              {canCreate && (
                <Link
                  to="/course/new"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-bold text-[#0B3B3C] transition-colors hover:bg-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]"
                >
                  <Plus size={16} weight="bold" aria-hidden="true" />
                  {t('nav.createCourse')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10 lg:px-8">
        {/* Tabs / Meta bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {isStudent ? (
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
                onClick={() => handleTabChange('all')}
                className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                  activeTab === 'all'
                    ? 'bg-[#0D9488] text-white'
                    : 'text-[#335C5D] hover:text-[#0B3B3C]'
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
                onClick={() => handleTabChange('enrolled')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                  activeTab === 'enrolled'
                    ? 'bg-[#0D9488] text-white'
                    : 'text-[#335C5D] hover:text-[#0B3B3C]'
                }`}
              >
                {t('courses.tabEnrolled')}
                <span
                  className={`rounded px-1.5 py-0.5 font-mono-tabular text-[11px] font-bold ${
                    activeTab === 'enrolled'
                      ? 'bg-[#F59E0B] text-[#0B3B3C]'
                      : 'bg-[#FEF3C7] text-[#92400E]'
                  }`}
                >
                  {myCourses.length}
                </span>
              </button>
            </div>
          ) : (
            <div />
          )}

          <p className="rounded-full bg-[#CCFBF1] px-3 py-1 font-mono-tabular text-xs font-semibold text-[#0F766E]">
            {loading && displayedCourses.length === 0
              ? t('courses.loadingCount')
              : activeTab === 'enrolled'
              ? t('courses.enrolledCount', { count: myCourses.length })
              : searchQuery
              ? t('courses.catalogCountMatching', {
                  label: catalogCountLabel,
                  query: searchQuery,
                })
              : catalogCountLabel}
          </p>
        </div>

        {error && (
          <AlertBanner variant="error" className="mt-6" onDismiss={() => setError('')}>
            {tServer(error)}
          </AlertBanner>
        )}

        {/* Course Grid */}
        <div
          id="courses-tabpanel"
          role={isStudent ? 'tabpanel' : undefined}
          aria-labelledby={
            isStudent ? (activeTab === 'enrolled' ? 'tab-enrolled' : 'tab-all') : undefined
          }
        >
          {loading && displayedCourses.length === 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-52 animate-pulse rounded-xl border border-[#99F6E4] bg-white p-6"
                />
              ))}
            </div>
          ) : displayedCourses.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-[#99F6E4] bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#CCFBF1] text-[#0D9488]">
                <BookOpen size={24} weight="duotone" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold text-[#0D2E2F]">
                {activeTab === 'enrolled'
                  ? t('courses.emptyEnrolledTitle')
                  : searchQuery
                  ? t('courses.emptySearchTitle')
                  : t('courses.emptyAllTitle')}
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-[#335C5D]">
                {activeTab === 'enrolled'
                  ? t('courses.emptyEnrolledBody')
                  : searchQuery
                  ? t('courses.emptySearchBody')
                  : canCreate
                  ? t('courses.emptyAllBodyAdmin')
                  : t('courses.emptyAllBodyStudent')}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                {activeTab === 'enrolled' && (
                  <button
                    type="button"
                    onClick={() => handleTabChange('all')}
                    className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                  >
                    {t('courses.browseAll')}
                  </button>
                )}
                {activeTab === 'all' && searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-4 py-2 text-sm font-medium text-[#0D2E2F] hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                  >
                    {t('courses.clearSearch')}
                  </button>
                )}
                {activeTab === 'all' && !searchQuery && canCreate && (
                  <Link
                    to="/course/new"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                  >
                    <Plus size={15} weight="bold" aria-hidden="true" />
                    {t('nav.createCourse')}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {displayedCourses.map((course, idx) => {
                const id = course._id || course.id;
                const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0;
                const isEnrolled = enrolledIds.includes(id);
                const manageable = canManageCourse(course);
                const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];

                return (
                  <article
                    key={id}
                    className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#0D9488] hover:shadow-md"
                  >
                    <div>
                      <div className={`h-1.5 w-full ${accent.topBar}`} />
                      <div className="p-6">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded-md px-2.5 py-1 font-mono-tabular text-xs font-semibold ${accent.pill}`}
                          >
                            {formatCount(moduleCount, 'module')}
                          </span>

                          {isEnrolled && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#D1FAE5] px-2.5 py-1 text-xs font-semibold text-[#065F46] ring-1 ring-[#A7F3D0]">
                              <CheckCircle size={13} weight="fill" aria-hidden="true" />
                              {t('courses.enrolledBadge')}
                            </span>
                          )}
                        </div>

                        <h2
                          dir="auto"
                          className="mt-3 font-display text-lg font-semibold leading-snug text-[#0D2E2F]"
                        >
                          {course.title}
                        </h2>
                        <p
                          dir="auto"
                          className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#335C5D]"
                        >
                          {course.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-[#CCFBF1] bg-[#F0FDFA]/55 px-6 py-3.5">
                      <Link
                        to={`/course/${id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] hover:text-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                      >
                        {!userToken
                          ? t('home.signInToView')
                          : isEnrolled
                          ? t('courses.continueLearning')
                          : manageable
                          ? t('courses.manageCurriculum')
                          : t('courses.openCourse')}
                        <ArrowRight
                          size={15}
                          weight="bold"
                          aria-hidden="true"
                          className="rtl:rotate-180"
                        />
                      </Link>

                      {manageable && (
                        <button
                          type="button"
                          onClick={() => setCourseToDelete(course)}
                          aria-label={t('courses.deleteLabel', { title: course.title })}
                          title={t('courses.deleteTitle')}
                          className="rounded-lg p-1.5 text-[#52797A] transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                        >
                          <Trash size={17} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {activeTab === 'all' && totalPages > 1 && (
          <nav
            aria-label={t('courses.viewsAria')}
            className="mt-10 flex items-center justify-center gap-3"
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-white px-3.5 py-2 text-sm font-medium text-[#0D2E2F] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <ArrowLeft size={15} aria-hidden="true" className="rtl:rotate-180" />
              {t('courses.prev')}
            </button>

            <span className="font-mono-tabular rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0F766E] ring-1 ring-[#99F6E4]">
              {t('courses.pageOf', { page, total: totalPages })}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-white px-3.5 py-2 text-sm font-medium text-[#0D2E2F] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t('courses.next')}
              <ArrowRight size={15} aria-hidden="true" className="rtl:rotate-180" />
            </button>
          </nav>
        )}

        <ConfirmDialog
          open={Boolean(courseToDelete)}
          onClose={() => !deleting && setCourseToDelete(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
          title={t('courses.deleteTitle')}
          message={
            courseToDelete
              ? t('courses.deleteMsg', { title: courseToDelete.title })
              : ''
          }
          confirmLabel={t('courses.deleteConfirm')}
        />
      </div>
    </div>
  );
};
