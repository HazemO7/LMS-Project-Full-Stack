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

export const buildCatalogParams = (nextTab, nextPage, nextQuery) => {
  const params = {};
  if (nextTab === 'enrolled') params.tab = 'enrolled';
  if (nextPage > 1 && nextTab !== 'enrolled') params.page = String(nextPage);
  if (nextQuery && nextTab !== 'enrolled') params.q = nextQuery;
  return params;
};

export const parseInitialCatalogState = (searchParams) => {
  const parsedPage = parseInt(searchParams.get('page') || '1', 10);
  return {
    page: parsedPage > 0 ? parsedPage : 1,
    query: searchParams.get('q') || '',
    tab: searchParams.get('tab') === 'enrolled' ? 'enrolled' : 'all',
  };
};

export const normalizeCatalogResponse = (data) => {
  const list = Array.isArray(data) ? data : data.courses || data.data || [];
  return {
    list,
    totalPages: data.totalPages || 1,
    totalCourses: data.totalCourses ?? list.length,
  };
};

export const extractEnrolledCourses = (res) => {
  const enrollments = Array.isArray(res?.data) ? res.data : [];
  const enrolledList = enrollments.map((item) => item.course).filter(Boolean);
  return {
    enrolledList,
    enrolledIds: enrolledList.map((c) => c._id || c.id),
  };
};

export const withoutCourseId = (list, id) => list.filter((c) => (c._id || c.id) !== id);

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
