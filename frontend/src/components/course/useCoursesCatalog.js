import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { coursesAPI } from '../../services/api';

const buildCatalogParams = (nextTab, nextPage, nextQuery) => {
  const params = {};
  if (nextTab === 'enrolled') params.tab = 'enrolled';
  if (nextPage > 1 && nextTab !== 'enrolled') params.page = String(nextPage);
  if (nextQuery && nextTab !== 'enrolled') params.q = nextQuery;
  return params;
};

export const resolveTabFromKey = (key, activeTab, isRtl) => {
  if (key === 'Home') return 'all';
  if (key === 'End') return 'enrolled';
  const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
  const prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
  if (key === nextKey && activeTab === 'all') return 'enrolled';
  if (key === prevKey && activeTab === 'enrolled') return 'all';
  return null;
};

export const getCatalogSummaryText = ({
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

export const getEmptyStateContent = ({ activeTab, searchQuery, canCreate, t }) => {
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

export const useCatalogState = (isStudent) => {
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

  const applySearch = (query) => {
    setPage(1);
    setSearchQuery(query);
    syncUrlParams('all', 1, query);
  };

  const handleTabChange = (nextTab) => {
    setTab(nextTab);
    syncUrlParams(nextTab, page, searchQuery);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applySearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput('');
    applySearch('');
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

export const useCatalogData = ({ userToken, isStudent, page, searchQuery }) => {
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
