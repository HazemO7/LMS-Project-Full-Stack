import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Circle,
  FilmSlate,
  List,
  PencilSimple,
  Trash,
  VideoCameraSlash,
  X,
} from '@phosphor-icons/react';
import { coursesAPI, lessonsAPI, modulesAPI, progressAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { canManageCourse } from '../utils/roleUtils';
import { CreateModuleModal } from '../components/CreateModuleModal';
import { CreateLessonModal } from '../components/CreateLessonModal';
import { EditCourseModal } from '../components/EditCourseModal';
import { EditModuleModal } from '../components/EditModuleModal';
import { EditLessonModal } from '../components/EditLessonModal';
import { CourseHeader } from '../components/course/CourseHeader';
import { CourseEnrollmentGate } from '../components/course/CourseEnrollmentGate';
import { CourseSyllabusSidebar } from '../components/course/CourseSyllabusSidebar';
import { AlertBanner } from '../components/ui/AlertBanner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { getYouTubeEmbedUrl, isDemoPlaceholderVideo } from '../utils/youtube';

const isAccessDeniedError = (err) => {
  if (err.status === 403) return true;
  const msg = (err.message || '').toLowerCase();
  return msg.includes('enrolled') || msg.includes('access denied');
};

const flattenCourseLessons = (modules) => {
  const list = [];
  modules.forEach((mod) => {
    if (typeof mod !== 'object' || !Array.isArray(mod.lesson)) return;
    mod.lesson.forEach((lessonObj) => {
      if (typeof lessonObj !== 'object' || lessonObj === null) return;
      list.push({
        lesson: lessonObj,
        lessonId: lessonObj._id || lessonObj.id,
        moduleId: mod._id || mod.id,
        moduleTitle: mod.title,
      });
    });
  });
  return list;
};

const findInitialLessonId = (flattenedLessons, completedLessons) => {
  const completedSet = new Set(completedLessons || []);
  const firstIncomplete = flattenedLessons.find((item) => !completedSet.has(item.lessonId));
  return (firstIncomplete || flattenedLessons[0]).lessonId;
};

const appendModuleToCourse = (course, newModule) => ({
  ...course,
  modules: [...(course.modules || []), newModule],
});

const appendLessonToCourse = (course, moduleId, newLesson) => ({
  ...course,
  modules: (course.modules || []).map((mod) =>
    (mod._id || mod.id) === moduleId
      ? { ...mod, lesson: [...(mod.lesson || []), newLesson] }
      : mod
  ),
});

const removeModuleFromCourse = (course, targetId) => ({
  ...course,
  modules: (course.modules || []).filter((m) => (m._id || m.id) !== targetId),
});

const removeLessonFromCourse = (course, moduleId, lessonId) => ({
  ...course,
  modules: (course.modules || []).map((m) => {
    if ((m._id || m.id) !== moduleId) return m;
    return { ...m, lesson: (m.lesson || []).filter((l) => (l._id || l.id) !== lessonId) };
  }),
});

const updateModuleInCourse = (course, updatedMod) => ({
  ...course,
  modules: (course.modules || []).map((m) =>
    (m._id || m.id) === (updatedMod._id || updatedMod.id) ? { ...m, ...updatedMod } : m
  ),
});

const updateLessonInCourse = (course, updatedLesson) => ({
  ...course,
  modules: (course.modules || []).map((m) => ({
    ...m,
    lesson: m.lesson
      ? m.lesson.map((l) =>
          (l._id || l.id) === (updatedLesson._id || updatedLesson.id)
            ? { ...l, ...updatedLesson }
            : l
        )
      : [],
  })),
});

const useCourseData = ({ id, currentUserRole, userLoading }) => {
  const [course, setCourse] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const loadOverviewFallback = useCallback(async () => {
    try {
      const basicData = await coursesAPI.getById(id);
      setCourse(basicData.data || basicData);
    } catch {
      setError('Failed to load course overview.');
    }
  }, [id]);

  const fetchCourseData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const courseData = await coursesAPI.getByIdFull(id);
      setCourse(courseData.course || courseData.data || courseData);
      setAccessDenied(false);

      if (currentUserRole !== 'student') {
        setProgressData(null);
        return;
      }
      const pData = await progressAPI.getCourseProgress(id).catch(() => null);
      setProgressData(pData);
    } catch (err) {
      if (isAccessDeniedError(err)) {
        setAccessDenied(true);
        await loadOverviewFallback();
      } else {
        setError(err.message || 'Failed to fetch course details.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, currentUserRole, loadOverviewFallback]);

  useEffect(() => {
    if (!userLoading) {
      fetchCourseData();
    }
  }, [userLoading, fetchCourseData]);

  return {
    course,
    setCourse,
    progressData,
    setProgressData,
    loading,
    error,
    setError,
    accessDenied,
    fetchCourseData,
  };
};

const useLessonNavigation = (flattenedLessons, completedLessons) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLessonId, setSelectedLessonId] = useState(
    () => searchParams.get('lesson') || null
  );

  const selectLesson = useCallback(
    (lessonId, shouldScroll = false) => {
      setSelectedLessonId(lessonId);
      if (lessonId) {
        setSearchParams({ lesson: lessonId }, { replace: true });
      }
      if (shouldScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [setSearchParams]
  );

  let effectiveLessonId = null;
  if (flattenedLessons.length > 0) {
    const exists = flattenedLessons.some((item) => item.lessonId === selectedLessonId);
    effectiveLessonId = exists
      ? selectedLessonId
      : findInitialLessonId(flattenedLessons, completedLessons);
  }

  const activeIndex = flattenedLessons.findIndex((item) => item.lessonId === effectiveLessonId);
  const activeEntry = activeIndex >= 0 ? flattenedLessons[activeIndex] : null;
  const prevEntry = activeIndex > 0 ? flattenedLessons[activeIndex - 1] : null;
  const nextEntry =
    activeIndex >= 0 && activeIndex < flattenedLessons.length - 1
      ? flattenedLessons[activeIndex + 1]
      : null;

  return { selectedLessonId: effectiveLessonId, selectLesson, activeEntry, prevEntry, nextEntry };
};

const CourseDetailsSkeleton = () => (
  <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" role="status" aria-busy="true">
    <div className="h-28 animate-pulse rounded-2xl border border-[#99F6E4] bg-white" />
    <div className="mt-6 grid gap-6 lg:grid-cols-12">
      <div className="h-96 animate-pulse rounded-2xl border border-[#99F6E4] bg-white lg:col-span-4" />
      <div className="h-96 animate-pulse rounded-2xl border border-[#99F6E4] bg-white lg:col-span-8" />
    </div>
  </div>
);

const LessonVideoTheater = ({ videoUrl, lessonTitle, t }) => {
  if (!videoUrl) return null;

  if (isDemoPlaceholderVideo(videoUrl)) {
    return (
      <div className="mb-6 overflow-hidden rounded-xl border border-[#1E6466] bg-[#0B3B3C]">
        <div className="flex aspect-video flex-col items-center justify-center px-6 text-center text-white">
          <FilmSlate size={36} weight="duotone" aria-hidden="true" className="text-[#F59E0B]" />
          <p className="mt-3 font-display text-base font-semibold">{t('player.placeholderTitle')}</p>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-[#CCFBF1]/80">
            {t('player.placeholderBody', { url: videoUrl })}
          </p>
        </div>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(videoUrl);
  if (embedUrl) {
    return (
      <div className="mb-6 overflow-hidden rounded-xl border border-[#1E6466] bg-[#0B3B3C]">
        <div className="aspect-video w-full">
          <iframe
            src={embedUrl}
            title={lessonTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-[#1E6466] bg-[#0B3B3C]">
      <div className="flex aspect-video flex-col items-center justify-center px-6 text-center text-white">
        <VideoCameraSlash size={34} weight="duotone" aria-hidden="true" className="text-[#99F6E4]" />
        <p className="mt-3 text-sm font-medium">{t('player.unsupportedVideo')}</p>
        <p className="mt-1 text-xs text-[#99F6E4]/80">{t('player.unsupportedVideoHint')}</p>
      </div>
    </div>
  );
};

const CourseNotFound = ({ error, t, tServer }) => (
  <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
    <AlertBanner variant="error">
      {error ? tServer(error) : tServer('Course not found')}
    </AlertBanner>
    <Link
      to="/courses"
      className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 py-2 text-sm font-semibold text-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
    >
      <ArrowLeft size={15} aria-hidden="true" className="rtl:rotate-180" />
      {t('player.returnCatalog')}
    </Link>
  </div>
);

const MobileSyllabusBar = ({ mobileSyllabusOpen, onToggle, lessonCountLabel, t }) => (
  <div className="mb-4 flex items-center justify-between lg:hidden">
    <button
      type="button"
      aria-expanded={mobileSyllabusOpen}
      aria-controls="course-curriculum-sidebar"
      onClick={onToggle}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-semibold text-[#0D2E2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
    >
      {mobileSyllabusOpen ? <X size={16} aria-hidden="true" /> : <List size={16} aria-hidden="true" />}
      {mobileSyllabusOpen ? t('player.hideCurriculum') : t('player.showCurriculum')}
    </button>
    <span className="font-mono-tabular rounded bg-[#CCFBF1] px-2.5 py-1 text-xs font-semibold text-[#0F766E]">
      {lessonCountLabel}
    </span>
  </div>
);

const LessonHeaderBar = ({ activeEntry, canManage, onEditLesson, onDeleteLesson, t }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#CCFBF1] pb-5">
    <div className="min-w-0 flex-1 text-start">
      <span className="inline-block rounded-md bg-[#CCFBF1] px-2.5 py-0.5 text-xs font-semibold text-[#0F766E]">
        <bdi>{activeEntry.moduleTitle}</bdi>
      </span>
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0D2E2F]">
        <bdi>{activeEntry.lesson.title}</bdi>
      </h2>
      {activeEntry.lesson.description && (
        <p className="mt-1.5 text-sm text-[#335C5D]">
          <bdi>{activeEntry.lesson.description}</bdi>
        </p>
      )}
    </div>

    {canManage && (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEditLesson(activeEntry.lesson)}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-3.5 py-2 text-xs font-medium text-[#0D2E2F] hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
        >
          <PencilSimple size={14} aria-hidden="true" />
          {t('player.editLesson')}
        </button>
        <button
          type="button"
          onClick={() => onDeleteLesson(activeEntry)}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2 text-xs font-medium text-[#DC2626] hover:bg-[#FEE2E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
        >
          <Trash size={14} aria-hidden="true" />
          {t('common.delete')}
        </button>
      </div>
    )}
  </div>
);

const CompletionToggleButton = ({ completed, markingComplete, onClick, t }) => {
  const styleClass = completed
    ? 'bg-[#D1FAE5] text-[#065F46] ring-1 ring-[#6EE7B7] hover:bg-[#A7F3D0]'
    : 'bg-[#0F766E] text-white hover:bg-[#115E59]';

  return (
    <button
      type="button"
      aria-pressed={completed}
      disabled={markingComplete}
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60 ${styleClass}`}
    >
      {completed ? (
        <>
          <CheckCircle size={17} weight="fill" aria-hidden="true" />
          {t('player.completed')}
        </>
      ) : (
        <>
          <Circle size={17} aria-hidden="true" />
          {markingComplete ? t('common.saving') : t('player.markComplete')}
        </>
      )}
    </button>
  );
};

const LessonNavigationBar = ({
  prevEntry,
  nextEntry,
  onSelectLesson,
  showCompletion,
  completed,
  markingComplete,
  onToggleComplete,
  t,
}) => (
  <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#CCFBF1] pt-6">
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={!prevEntry}
        onClick={() => prevEntry && onSelectLesson(prevEntry.lessonId, true)}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-4 py-2 text-sm font-medium text-[#0D2E2F] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft size={15} aria-hidden="true" className="rtl:rotate-180" />
        {t('player.prevLesson')}
      </button>
      <button
        type="button"
        disabled={!nextEntry}
        onClick={() => nextEntry && onSelectLesson(nextEntry.lessonId, true)}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-4 py-2 text-sm font-medium text-[#0D2E2F] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t('player.nextLesson')}
        <ArrowRight size={15} aria-hidden="true" className="rtl:rotate-180" />
      </button>
    </div>

    {showCompletion && (
      <CompletionToggleButton
        completed={completed}
        markingComplete={markingComplete}
        onClick={onToggleComplete}
        t={t}
      />
    )}
  </div>
);

const LessonEmptySelection = ({ modulesEmpty, t }) => (
  <div className="py-12 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#CCFBF1] text-[#0F766E]">
      <BookOpen size={24} weight="duotone" aria-hidden="true" />
    </div>
    <h2 className="mt-4 font-display text-lg font-semibold text-[#0D2E2F]">
      {t('player.noSelectionTitle')}
    </h2>
    <p className="mx-auto mt-1.5 max-w-md text-sm text-[#335C5D]">
      {modulesEmpty ? t('player.noSelectionModulesEmpty') : t('player.noSelectionLessonsEmpty')}
    </p>
  </div>
);

const CourseLessonPanel = ({
  focusMode,
  activeEntry,
  prevEntry,
  nextEntry,
  modulesEmpty,
  canManage,
  showCompletion,
  completed,
  markingComplete,
  onSelectLesson,
  onEditLesson,
  onDeleteLesson,
  onToggleComplete,
  t,
}) => (
  <section
    aria-label={t('player.activeLessonAria')}
    className={`overflow-hidden rounded-2xl border border-[#99F6E4] border-t-4 border-t-[#0F766E] bg-white shadow-xs ${
      focusMode ? 'mx-auto w-full max-w-4xl lg:col-span-12' : 'lg:col-span-8'
    }`}
  >
    <div className="p-6 sm:p-8">
      {!activeEntry ? (
        <LessonEmptySelection modulesEmpty={modulesEmpty} t={t} />
      ) : (
        <div>
          <LessonVideoTheater
            videoUrl={activeEntry.lesson.videoUrl}
            lessonTitle={activeEntry.lesson.title}
            t={t}
          />
          <LessonHeaderBar
            activeEntry={activeEntry}
            canManage={canManage}
            onEditLesson={onEditLesson}
            onDeleteLesson={onDeleteLesson}
            t={t}
          />
          <div
            dir="auto"
            className="mt-6 max-w-[70ch] whitespace-pre-line text-start text-base leading-relaxed text-[#134E4A]"
          >
            {activeEntry.lesson.content}
          </div>
          <LessonNavigationBar
            prevEntry={prevEntry}
            nextEntry={nextEntry}
            onSelectLesson={onSelectLesson}
            showCompletion={showCompletion}
            completed={completed}
            markingComplete={markingComplete}
            onToggleComplete={onToggleComplete}
            t={t}
          />
        </div>
      )}
    </div>
  </section>
);

const CourseModals = ({
  course,
  modules,
  modals,
  onCloseModule,
  onCloseLesson,
  onCloseEditCourse,
  onCloseEditModule,
  onCloseEditLesson,
  onCloseDelete,
  onModuleCreated,
  onLessonCreated,
  onCourseUpdated,
  onModuleUpdated,
  onLessonUpdated,
  onDeleteConfirm,
  deleting,
  t,
}) => (
  <>
    <CreateModuleModal
      show={modals.showModule}
      onHide={onCloseModule}
      courseId={course._id || course.id}
      existingModules={modules}
      onModuleCreated={onModuleCreated}
    />
    <CreateLessonModal
      show={modals.showLesson}
      onHide={onCloseLesson}
      moduleId={modals.activeModuleId}
      onLessonCreated={onLessonCreated}
    />
    <EditCourseModal
      show={modals.showEditCourse}
      onHide={onCloseEditCourse}
      course={course}
      onUpdate={onCourseUpdated}
    />
    <EditModuleModal
      show={Boolean(modals.editingModule)}
      onHide={onCloseEditModule}
      moduleData={modals.editingModule}
      onUpdate={onModuleUpdated}
    />
    <EditLessonModal
      show={Boolean(modals.editingLesson)}
      onHide={onCloseEditLesson}
      lessonData={modals.editingLesson}
      onUpdate={onLessonUpdated}
    />
    <ConfirmDialog
      open={Boolean(modals.deleteTarget)}
      onClose={onCloseDelete}
      onConfirm={onDeleteConfirm}
      loading={deleting}
      title={
        modals.deleteTarget?.type === 'module'
          ? t('player.deleteModuleTitle')
          : t('player.deleteLessonTitle')
      }
      message={
        modals.deleteTarget
          ? t('player.deleteConfirmMsg', { title: modals.deleteTarget.title })
          : ''
      }
      confirmLabel={
        modals.deleteTarget?.type === 'module'
          ? t('player.deleteModuleTitle')
          : t('player.deleteLessonTitle')
      }
    />
  </>
);

export const CourseDetails = () => {
  const { id } = useParams();
  const { currentUser, userLoading } = useAuth();
  const { t, formatCount, tServer } = useLanguage();
  const { addToast } = useToast();

  const data = useCourseData({ id, currentUserRole: currentUser?.role, userLoading });
  const modules = useMemo(() => data.course?.modules || [], [data.course?.modules]);
  const flattenedLessons = useMemo(() => flattenCourseLessons(modules), [modules]);
  const nav = useLessonNavigation(flattenedLessons, data.progressData?.completedLessons);

  const [enrolling, setEnrolling] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [mobileSyllabusOpen, setMobileSyllabusOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isStudent = currentUser?.role === 'student';
  const canManage = canManageCourse(currentUser, data.course);
  const isPopulated = modules.length > 0 && typeof modules[0] === 'object';
  const isLessonCompleted = (lessonId) =>
    Boolean(data.progressData?.completedLessons?.includes(lessonId));

  const handleEnroll = async () => {
    setEnrolling(true);
    data.setError('');
    try {
      await coursesAPI.enroll(id);
      await data.fetchCourseData();
      addToast(t('player.enrolledSuccess'), 'success');
    } catch (err) {
      data.setError(err.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!data.course || !nav.activeEntry) return;
    const { lessonId, lesson } = nav.activeEntry;
    setMarkingComplete(true);
    data.setError('');
    try {
      const courseId = data.course._id || data.course.id;
      const wasDone = isLessonCompleted(lessonId);
      await progressAPI.completeLesson(lessonId, courseId);
      data.setProgressData(await progressAPI.getCourseProgress(courseId));
      const key = wasDone ? 'player.progressMarkedUndone' : 'player.progressMarkedDone';
      const msg = t(key, { title: lesson.title });
      setStatusMessage(msg);
      addToast(msg, 'success');
    } catch (err) {
      data.setError(err.message || 'Could not update completion status.');
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    data.setError('');
    try {
      if (deleteTarget.type === 'module') {
        await modulesAPI.delete(deleteTarget.id);
        data.setCourse((prev) => removeModuleFromCourse(prev, deleteTarget.id));
      } else {
        await lessonsAPI.delete(deleteTarget.id);
        data.setCourse((prev) =>
          removeLessonFromCourse(prev, deleteTarget.moduleId, deleteTarget.id)
        );
      }
      if (isStudent) {
        const updatedP = await progressAPI.getCourseProgress(id).catch(() => null);
        if (updatedP) data.setProgressData(updatedP);
      }
      setDeleteTarget(null);
    } catch (err) {
      data.setError(err.message || 'Failed to delete item.');
    } finally {
      setDeleting(false);
    }
  };

  if (data.loading || userLoading) return <CourseDetailsSkeleton />;
  if (!data.course) return <CourseNotFound error={data.error} t={t} tServer={tServer} />;

  return (
    <div>
      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>

      <CourseHeader
        course={data.course}
        canManage={canManage}
        accessDenied={data.accessDenied}
        progressData={data.progressData}
        completedCount={data.progressData?.completedCount ?? 0}
        totalLessons={data.progressData?.totalLessons ?? flattenedLessons.length}
        percentage={data.progressData?.percentage ?? 0}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((prev) => !prev)}
        onEditCourse={() => setShowEditModal(true)}
        onAddModule={() => setShowModuleModal(true)}
        t={t}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {data.error && (
          <AlertBanner variant="error" className="mb-6" onDismiss={() => data.setError('')}>
            {tServer(data.error)}
          </AlertBanner>
        )}

        {data.accessDenied ? (
          <CourseEnrollmentGate
            isStudent={isStudent}
            enrolling={enrolling}
            onEnroll={handleEnroll}
            moduleCount={modules.length}
            formatCount={formatCount}
            t={t}
          />
        ) : (
          <div>
            {!isPopulated && modules.length > 0 && (
              <AlertBanner variant="warning" className="mb-6">
                {t('player.syncWarning')}
              </AlertBanner>
            )}

            <MobileSyllabusBar
              mobileSyllabusOpen={mobileSyllabusOpen}
              onToggle={() => setMobileSyllabusOpen((prev) => !prev)}
              lessonCountLabel={formatCount(flattenedLessons.length, 'lesson')}
              t={t}
            />

            <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
              <CourseSyllabusSidebar
                modules={modules}
                flattenedCount={flattenedLessons.length}
                canManage={canManage}
                isStudent={isStudent}
                hasProgress={Boolean(data.progressData)}
                focusMode={focusMode}
                selectedLessonId={nav.selectedLessonId}
                isLessonCompleted={isLessonCompleted}
                mobileSyllabusOpen={mobileSyllabusOpen}
                onSelectLesson={(lessonId) => {
                  nav.selectLesson(lessonId);
                  setMobileSyllabusOpen(false);
                }}
                onAddModule={() => setShowModuleModal(true)}
                onEditModule={setEditingModule}
                onDeleteModule={(moduleId, title) =>
                  setDeleteTarget({ type: 'module', id: moduleId, title })
                }
                onAddLesson={(moduleId) => {
                  setActiveModuleId(moduleId);
                  setShowLessonModal(true);
                }}
                formatCount={formatCount}
                t={t}
              />

              <CourseLessonPanel
                focusMode={focusMode}
                activeEntry={nav.activeEntry}
                prevEntry={nav.prevEntry}
                nextEntry={nav.nextEntry}
                modulesEmpty={modules.length === 0}
                canManage={canManage}
                showCompletion={Boolean(isStudent && data.progressData)}
                completed={nav.activeEntry ? isLessonCompleted(nav.activeEntry.lessonId) : false}
                markingComplete={markingComplete}
                onSelectLesson={nav.selectLesson}
                onEditLesson={setEditingLesson}
                onDeleteLesson={(entry) =>
                  setDeleteTarget({
                    type: 'lesson',
                    id: entry.lessonId,
                    moduleId: entry.moduleId,
                    title: entry.lesson.title,
                  })
                }
                onToggleComplete={handleToggleComplete}
                t={t}
              />
            </div>
          </div>
        )}
      </div>

      <CourseModals
        course={data.course}
        modules={modules}
        modals={{
          showModule: showModuleModal,
          showLesson: showLessonModal,
          showEditCourse: showEditModal,
          activeModuleId,
          editingModule,
          editingLesson,
          deleteTarget,
        }}
        deleting={deleting}
        onCloseModule={() => setShowModuleModal(false)}
        onCloseLesson={() => {
          setShowLessonModal(false);
          setActiveModuleId(null);
        }}
        onCloseEditCourse={() => setShowEditModal(false)}
        onCloseEditModule={() => setEditingModule(null)}
        onCloseEditLesson={() => setEditingLesson(null)}
        onCloseDelete={() => !deleting && setDeleteTarget(null)}
        onModuleCreated={(newMod) => data.setCourse((prev) => appendModuleToCourse(prev, newMod))}
        onLessonCreated={(newLesson, moduleId) => {
          data.setCourse((prev) => appendLessonToCourse(prev, moduleId, newLesson));
          const newId = newLesson._id || newLesson.id;
          if (newId) nav.selectLesson(newId);
        }}
        onCourseUpdated={(updated) => data.setCourse((prev) => ({ ...prev, ...updated }))}
        onModuleUpdated={(updatedMod) =>
          data.setCourse((prev) => updateModuleInCourse(prev, updatedMod))
        }
        onLessonUpdated={(updatedLesson) =>
          data.setCourse((prev) => updateLessonInCourse(prev, updatedLesson))
        }
        onDeleteConfirm={handleDeleteConfirm}
        t={t}
      />
    </div>
  );
};
