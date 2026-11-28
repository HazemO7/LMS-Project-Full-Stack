import React, { useState } from 'react';
import { coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { canAuthorCourses, canManageCourse } from '../utils/roleUtils';
import { AlertBanner } from '../components/ui/AlertBanner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Pagination } from '../components/ui/Pagination';
import {
  getCatalogSummaryText,
  getEmptyStateContent,
} from '../components/course/catalogHelpers';
import {
  useCatalogData,
  useCatalogState,
} from '../components/course/useCoursesCatalog';
import {
  ActiveSearchChip,
  CoursesHeader,
  CoursesTabsBar,
} from '../components/course/CoursesHeaderBar';
import { CoursesGrid } from '../components/course/CoursesCatalogGrid';

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
  const panelLabelId = isStudent
    ? catalog.activeTab === 'enrolled'
      ? 'tab-enrolled'
      : 'tab-all'
    : undefined;

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

        <div id="courses-tabpanel" role={isStudent ? 'tabpanel' : undefined} aria-labelledby={panelLabelId}>
          <CoursesGrid
            loading={data.loading}
            displayedCourses={displayedCourses}
            emptyContent={emptyContent}
            userToken={userToken}
            canManageFn={(course) => canManageCourse(currentUser, course)}
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
