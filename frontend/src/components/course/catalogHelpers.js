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

const getCourseId = (course) => course._id ?? course.id;

const parsePageParam = (raw) => {
  const parsed = parseInt(raw, 10);
  return parsed > 0 ? parsed : 1;
};

const extractCourseList = (data) => {
  if (Array.isArray(data)) return data;
  if (data.courses) return data.courses;
  return data.data ?? [];
};

const formatAllTabCount = (searchQuery, catalogCountLabel, t) => {
  if (!searchQuery) return catalogCountLabel;
  return t('courses.catalogCountMatching', { label: catalogCountLabel, query: searchQuery });
};

const getAllTabEmptyState = (canCreate, t) => ({
  title: t('courses.emptyAllTitle'),
  body: canCreate ? t('courses.emptyAllBodyAdmin') : t('courses.emptyAllBodyStudent'),
  actionType: canCreate ? 'createCourse' : 'none',
});

export const buildCatalogParams = (nextTab, nextPage, nextQuery) => {
  if (nextTab === 'enrolled') return { tab: 'enrolled' };
  const params = {};
  if (nextPage > 1) params.page = String(nextPage);
  if (nextQuery) params.q = nextQuery;
  return params;
};

export const parseInitialCatalogState = (searchParams) => ({
  page: parsePageParam(searchParams.get('page')),
  query: searchParams.get('q') ?? '',
  tab: searchParams.get('tab') === 'enrolled' ? 'enrolled' : 'all',
});

export const normalizeCatalogResponse = (data) => {
  const list = extractCourseList(data);
  return {
    list,
    totalPages: data.totalPages ?? 1,
    totalCourses: data.totalCourses ?? list.length,
  };
};

export const extractEnrolledCourses = (res) => {
  const enrollments = Array.isArray(res?.data) ? res.data : [];
  const enrolledList = enrollments.map((item) => item.course).filter(Boolean);
  return {
    enrolledList,
    enrolledIds: enrolledList.map(getCourseId),
  };
};

export const withoutCourseId = (list, id) => list.filter((c) => getCourseId(c) !== id);

export const resolveTabFromKey = (key, activeTab, isRtl) => {
  const target = (isRtl ? KEY_TARGET_RTL : KEY_TARGET_LTR)[key] ?? null;
  return target === activeTab ? null : target;
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
  return formatAllTabCount(searchQuery, catalogCountLabel, t);
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
  return getAllTabEmptyState(canCreate, t);
};
