import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { coursesAPI } from '../../services/api';

const KEY_TARGET_LTR = {
  Home: 'all',
  End: 'enrolled',
  ArrowLeft: 'all',
  ArrowRight: 'enrolled',
};

const KEY_TARGET_RTL = {
  Home: 'all',
  End: 'enrolled',
  ArrowLeft: 'enrolled',
  ArrowRight: 'all',
};

const buildCatalogParams = (nextTab, nextPage, nextQuery) => {
  const params = {};
  if (nextTab === 'enrolled') params.tab = 'enrolled';
  if (nextPage > 1 && nextTab !== 'enrolled') params.page = String(nextPage);
  if (nextQuery && nextTab !== 'enrolled') params.q = nextQuery;
  return params;
};

const parseInitialCatalogState = (searchParams) => {
  const parsedPage = parseInt(searchParams.get('page') || '1', 10);
  return {
    page: parsedPage > 0 ? parsedPage : 1,
    query: searchParams.get('q') || '',
    tab: searchParams.get('tab') === 'enrolled' ? 'enrolled' : 'all',
  };
};

const normalizeCatalogResponse = (data) => {
  const list = Array.isArray(data) ? data : data.courses || data.data || [];
  return {
    list,
    totalPages: data.totalPages || 1,
    totalCourses: data.totalCourses ?? list.length,
  };
};

const extractEnrolledCourses = (res) => {
  const enrollments = Array.isArray(res?.data) ? res.data : [];
  const enrolledList = enrollments.map((item) => item.course).filter(Boolean);
  return {
    enrolledList,
    enrolledIds: enrolledList.map((c) => c._id || c.id),
  };
};

const withoutCourseId = (list, id) => list.filter((c) => (c._id || c.id) !== id);

const useEnrolledUrlGuard = (isStudent, searchParams, onReset) => {
  useEffect(() => {
    if (!isStudent && searchParams.get('tab') === 'enrolled') {
      onReset();
    }
  }, [isStudent, searchParams, onReset]);
};

const useDebouncedSearchSync = ({ activeTab, searchInput, searchQuery, onCommit }) => {
  useEffect(() => {
    if (activeTab !== 'all') return undefined;
    const trimmed = searchInput.trim();
    if (trimmed === searchQuery) return undefined;
    const timer = window.setTimeout(() => onCommit(trimmed), 300);
    return () => window.clearTimeout(timer);
  }, [activeTab, searchInput, searchQuery, onCommit]);
};

const useCatalogList = (page, searchQuery) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await coursesAPI.getAll(page, 6, searchQuery);
      const parsed = normalizeCatalogResponse(data);
      setCourses(parsed.list);
      setTotalPages(parsed.totalPages);
      setTotalCourses(parsed.totalCourses);
    } catch (err) {
      setError(err.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return { courses, setCourses, loading, error, setError, totalPages, totalCourses, setTotalCourses };
};

const EMPTY_LIST = [];

const useEnrolledCourses = (userToken, isStudent) => {
  const [enrolledIds, setEnrolledIds] = useState(EMPTY_LIST);
  const [myCourses, setMyCourses] = useState(EMPTY_LIST);
  const enabled = Boolean(userToken && isStudent);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    coursesAPI
      .getMyCourses()
      .then((res) => {
        if (!active) return;
        const parsed = extractEnrolledCourses(res);
        setMyCourses(parsed.enrolledList);
        setEnrolledIds(parsed.enrolledIds);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [enabled]);

  return {
    enrolledIds: enabled ? enrolledIds : EMPTY_LIST,
    myCourses: enabled ? myCourses : EMPTY_LIST,
    setMyCourses,
  };
};

export const resolveTabFromKey = (key, activeTab, isRtl) => {
  const table = isRtl ? KEY_TARGET_RTL : KEY_TARGET_LTR;
  const target = table[key];
  if (!target || target === activeTab) return null;
  return target;
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
  const initial = parseInitialCatalogState(searchParams);

  const [tab, setTab] = useState(initial.tab);
  const [page, setPage] = useState(initial.page);
  const [searchInput, setSearchInput] = useState(initial.query);
  const [searchQuery, setSearchQuery] = useState(initial.query);
  const activeTab = isStudent ? tab : 'all';

  const syncUrlParams = useCallback(
    (nextTab, nextPage, nextQuery) => {
      setSearchParams(buildCatalogParams(nextTab, nextPage, nextQuery), { replace: true });
    },
    [setSearchParams]
  );

  const applySearch = useCallback(
    (query) => {
      setPage(1);
      setSearchQuery(query);
      syncUrlParams('all', 1, query);
    },
    [syncUrlParams]
  );

  const resetEnrolledTab = useCallback(
    () => syncUrlParams('all', page, searchQuery),
    [syncUrlParams, page, searchQuery]
  );

  useEnrolledUrlGuard(isStudent, searchParams, resetEnrolledTab);
  useDebouncedSearchSync({ activeTab, searchInput, searchQuery, onCommit: applySearch });

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
  const listState = useCatalogList(page, searchQuery);
  const enrolledState = useEnrolledCourses(userToken, isStudent);

  const removeCourseFromState = (id) => {
    listState.setCourses((prev) => withoutCourseId(prev, id));
    enrolledState.setMyCourses((prev) => withoutCourseId(prev, id));
    listState.setTotalCourses((prev) => Math.max(0, prev - 1));
  };

  return {
    courses: listState.courses,
    enrolledIds: enrolledState.enrolledIds,
    myCourses: enrolledState.myCourses,
    loading: listState.loading,
    error: listState.error,
    setError: listState.setError,
    totalPages: listState.totalPages,
    totalCourses: listState.totalCourses,
    removeCourseFromState,
  };
};
