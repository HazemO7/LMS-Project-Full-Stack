import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { coursesAPI } from '../../services/api';
import {
  buildCatalogParams,
  extractEnrolledCourses,
  normalizeCatalogResponse,
  parseInitialCatalogState,
  withoutCourseId,
} from './catalogHelpers';

const EMPTY_LIST = [];

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
  const requestIdRef = useRef(0);

  const fetchCatalog = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isLatest = () => requestId === requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const data = await coursesAPI.getAll(page, 6, searchQuery);
      if (!isLatest()) return;
      const parsed = normalizeCatalogResponse(data);
      setCourses(parsed.list);
      setTotalPages(parsed.totalPages);
      setTotalCourses(parsed.totalCourses);
    } catch (err) {
      if (isLatest()) setError(err.message || 'Failed to fetch courses');
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return { courses, setCourses, loading, error, setError, totalPages, totalCourses, setTotalCourses };
};

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
