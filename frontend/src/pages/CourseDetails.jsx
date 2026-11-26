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
  LockKey,
  PencilSimple,
  Play,
  Plus,
  SealCheck,
  Trash,
  VideoCameraSlash,
  X,
} from '@phosphor-icons/react';
import { coursesAPI, lessonsAPI, modulesAPI, progressAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { canManageCourse } from '../utils/roleUtils';
import { CreateModuleModal } from '../components/CreateModuleModal';
import { CreateLessonModal } from '../components/CreateLessonModal';
import { EditCourseModal } from '../components/EditCourseModal';
import { EditModuleModal } from '../components/EditModuleModal';
import { EditLessonModal } from '../components/EditLessonModal';
import { AlertBanner } from '../components/ui/AlertBanner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { getYouTubeEmbedUrl, isDemoPlaceholderVideo } from '../utils/youtube';

const InstructorByline = ({ instructor, t }) => {
  if (!instructor?.name) return null;
  const specialtySuffix = instructor.specialty ? ` · ${instructor.specialty}` : '';
  return (
    <p className="mt-1.5 text-xs font-semibold text-[#FBBF24]">
      {t('courses.byInstructor', { name: instructor.name })}
      {specialtySuffix}
    </p>
  );
};

export const CourseDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, userLoading } = useAuth();
  const { t, formatCount, tServer } = useLanguage();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const [progressData, setProgressData] = useState(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState(
    () => searchParams.get('lesson') || null
  );
  const [mobileSyllabusOpen, setMobileSyllabusOpen] = useState(false);

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isStudent = currentUser?.role === 'student';

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

  const fetchCourseData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const courseData = await coursesAPI.getByIdFull(id);
      const resolvedCourse = courseData.course || courseData.data || courseData;
      setCourse(resolvedCourse);
      setAccessDenied(false);

      if (currentUser?.role === 'student') {
        try {
          const pData = await progressAPI.getCourseProgress(id);
          setProgressData(pData);
        } catch {
          setProgressData(null);
        }
      } else {
        setProgressData(null);
      }
    } catch (err) {
      if (
        err.status === 403 ||
        err.message?.toLowerCase().includes('enrolled') ||
        err.message?.toLowerCase().includes('access denied')
      ) {
        setAccessDenied(true);
        try {
          const basicData = await coursesAPI.getById(id);
          setCourse(basicData.data || basicData);
        } catch {
          setError('Failed to load course overview.');
        }
      } else {
        setError(err.message || 'Failed to fetch course details.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, currentUser?.role]);

  useEffect(() => {
    if (!userLoading) {
      fetchCourseData();
    }
  }, [userLoading, fetchCourseData]);

  const modules = useMemo(() => course?.modules || [], [course?.modules]);
  const isPopulated = modules.length > 0 && typeof modules[0] === 'object';

  const flattenedLessons = useMemo(() => {
    const list = [];
    modules.forEach((mod) => {
      if (typeof mod !== 'object' || !Array.isArray(mod.lesson)) return;
      mod.lesson.forEach((lessonObj) => {
        if (typeof lessonObj === 'object' && lessonObj !== null) {
          list.push({
            lesson: lessonObj,
            lessonId: lessonObj._id || lessonObj.id,
            moduleId: mod._id || mod.id,
            moduleTitle: mod.title,
          });
        }
      });
    });
    return list;
  }, [modules]);

  useEffect(() => {
    if (flattenedLessons.length === 0) {
      setSelectedLessonId(null);
      return;
    }

    const stillExists = flattenedLessons.some(
      (item) => item.lessonId === selectedLessonId
    );
    if (!stillExists) {
      const completedSet = new Set(progressData?.completedLessons || []);
      const firstIncomplete = flattenedLessons.find(
        (item) => !completedSet.has(item.lessonId)
      );
      const targetId = (firstIncomplete || flattenedLessons[0]).lessonId;
      setSelectedLessonId(targetId);
    }
  }, [flattenedLessons, selectedLessonId, progressData?.completedLessons]);

  const activeIndex = flattenedLessons.findIndex(
    (item) => item.lessonId === selectedLessonId
  );
  const activeEntry = activeIndex >= 0 ? flattenedLessons[activeIndex] : null;
  const prevEntry = activeIndex > 0 ? flattenedLessons[activeIndex - 1] : null;
  const nextEntry =
    activeIndex >= 0 && activeIndex < flattenedLessons.length - 1
      ? flattenedLessons[activeIndex + 1]
      : null;

  const canManage = canManageCourse(currentUser, course);

  const handleEnroll = async () => {
    setEnrolling(true);
    setError('');
    try {
      await coursesAPI.enroll(id);
      await fetchCourseData();
    } catch (err) {
      setError(err.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const handleModuleCreated = (newModule) => {
    setCourse((prev) => ({
      ...prev,
      modules: [...(prev.modules || []), newModule],
    }));
  };

  const handleLessonCreated = (newLesson, moduleId) => {
    const newLessonId = newLesson._id || newLesson.id;
    setCourse((prev) => ({
      ...prev,
      modules: (prev.modules || []).map((mod) => {
        const mId = mod._id || mod.id;
        if (mId === moduleId) {
          return { ...mod, lesson: [...(mod.lesson || []), newLesson] };
        }
        return mod;
      }),
    }));
    if (newLessonId) {
      selectLesson(newLessonId);
    }
  };

  const handleToggleComplete = async (lessonId, lessonTitle) => {
    if (!course) return;
    setMarkingComplete(true);
    setError('');
    try {
      const courseId = course._id || course.id;
      const wasCompleted = Boolean(progressData?.completedLessons?.includes(lessonId));
      await progressAPI.completeLesson(lessonId, courseId);
      const updatedP = await progressAPI.getCourseProgress(courseId);
      setProgressData(updatedP);
      setStatusMessage(
        wasCompleted
          ? t('player.progressMarkedUndone', { title: lessonTitle })
          : t('player.progressMarkedDone', { title: lessonTitle })
      );
    } catch (err) {
      setError(err.message || 'Could not update completion status.');
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      if (deleteTarget.type === 'module') {
        await modulesAPI.delete(deleteTarget.id);
        setCourse((prev) => ({
          ...prev,
          modules: (prev.modules || []).filter(
            (m) => (m._id || m.id) !== deleteTarget.id
          ),
        }));
      } else if (deleteTarget.type === 'lesson') {
        await lessonsAPI.delete(deleteTarget.id);
        setCourse((prev) => ({
          ...prev,
          modules: (prev.modules || []).map((m) => {
            if ((m._id || m.id) === deleteTarget.moduleId) {
              return {
                ...m,
                lesson: (m.lesson || []).filter(
                  (l) => (l._id || l.id) !== deleteTarget.id
                ),
              };
            }
            return m;
          }),
        }));
      }
      if (currentUser?.role === 'student') {
        const updatedP = await progressAPI.getCourseProgress(id).catch(() => null);
        if (updatedP) setProgressData(updatedP);
      }
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || 'Failed to delete item.');
    } finally {
      setDeleting(false);
    }
  };

  const isLessonCompleted = (lessonId) =>
    Boolean(progressData?.completedLessons?.includes(lessonId));

  if (loading || userLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="h-28 animate-pulse rounded-2xl border border-[#99F6E4] bg-white" />
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-2xl border border-[#99F6E4] bg-white lg:col-span-4" />
          <div className="h-96 animate-pulse rounded-2xl border border-[#99F6E4] bg-white lg:col-span-8" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <AlertBanner variant="error">
          {error ? tServer(error) : tServer('Course not found')}
        </AlertBanner>
        <Link
          to="/courses"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
        >
          <ArrowLeft size={15} aria-hidden="true" className="rtl:rotate-180" />
          {t('player.returnCatalog')}
        </Link>
      </div>
    );
  }

  const completedCount = progressData?.completedCount ?? 0;
  const totalLessons = progressData?.totalLessons ?? flattenedLessons.length;
  const percentage = progressData?.percentage ?? 0;

  const renderSyllabusList = () => (
    <div className="space-y-4">
      {modules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#5EEAD4] bg-white p-5 text-center">
          <p className="text-sm font-medium text-[#0D2E2F]">{t('player.noModulesTitle')}</p>
          <p className="mt-1 text-xs text-[#335C5D]">
            {canManage ? t('player.noModulesAdmin') : t('player.noModulesStudent')}
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowModuleModal(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
            >
              <Plus size={14} weight="bold" aria-hidden="true" />
              {t('player.addModule')}
            </button>
          )}
        </div>
      ) : (
        modules.map((mod, mIdx) => {
          if (typeof mod === 'string') {
            return (
              <div
                key={mod}
                className="rounded-xl border border-[#99F6E4] bg-white p-3 text-xs text-[#335C5D]"
              >
                Module ID: {mod}
              </div>
            );
          }

          const mId = mod._id || mod.id || mIdx;
          const lessons = Array.isArray(mod.lesson) ? mod.lesson : [];

          return (
            <div
              key={mId}
              className="overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xs"
            >
              <div className="border-b border-[#CCFBF1] bg-[#E6F7F5] px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block rounded bg-[#FEF3C7] px-2 py-0.5 font-mono-tabular text-[11px] font-semibold text-[#92400E]">
                      {t('player.moduleLabel', { num: String(mIdx + 1).padStart(2, '0') })}
                    </span>
                    <h3 dir="auto" className="mt-1.5 font-display text-sm font-semibold text-[#0D2E2F]">
                      {mod.title}
                    </h3>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingModule(mod)}
                        aria-label={t('player.editModuleAria', { title: mod.title })}
                        title={t('modal.editModuleTitle')}
                        className="rounded p-1 text-[#335C5D] hover:bg-white hover:text-[#0B3B3C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                      >
                        <PencilSimple size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'module',
                            id: mId,
                            title: mod.title,
                          })
                        }
                        aria-label={t('player.deleteModuleAria', { title: mod.title })}
                        title={t('player.deleteModuleTitle')}
                        className="rounded p-1 text-[#335C5D] hover:bg-[#FEF2F2] hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                      >
                        <Trash size={15} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>

                {mod.description && (
                  <p dir="auto" className="mt-1 text-xs leading-relaxed text-[#335C5D]">
                    {mod.description}
                  </p>
                )}

                {canManage && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModuleId(mId);
                      setShowLessonModal(true);
                    }}
                    className="mt-2.5 inline-flex items-center gap-1 rounded text-xs font-semibold text-[#0F766E] hover:text-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                  >
                    <Plus size={13} weight="bold" aria-hidden="true" />
                    {t('player.addLesson')}
                  </button>
                )}
              </div>

              {lessons.length > 0 ? (
                <ul className="divide-y divide-[#CCFBF1]">
                  {lessons.map((lessonObj, lIdx) => {
                    if (typeof lessonObj === 'string') {
                      return (
                        <li key={lessonObj} className="px-4 py-2.5 text-xs text-[#52797A]">
                          Lesson ID: {lessonObj}
                        </li>
                      );
                    }

                    const lId = lessonObj._id || lessonObj.id || lIdx;
                    const active = lId === selectedLessonId;
                    const done = isLessonCompleted(lId);

                    return (
                      <li key={lId}>
                        <button
                          type="button"
                          onClick={() => {
                            selectLesson(lId);
                            setMobileSyllabusOpen(false);
                          }}
                          className={`flex w-full items-start gap-2.5 px-4 py-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0D9488] ${
                            active
                              ? 'border-s-4 border-s-[#0D9488] bg-[#CCFBF1]/60 text-[#0B3B3C]'
                              : 'bg-white text-[#335C5D] hover:bg-[#F0FDFA]'
                          }`}
                        >
                          {done ? (
                            <CheckCircle
                              size={17}
                              weight="fill"
                              aria-hidden="true"
                              className="mt-0.5 shrink-0 text-[#059669]"
                            />
                          ) : active ? (
                            <Play
                              size={16}
                              weight="fill"
                              aria-hidden="true"
                              className="mt-0.5 shrink-0 text-[#D97706]"
                            />
                          ) : (
                            <Circle
                              size={16}
                              aria-hidden="true"
                              className="mt-0.5 shrink-0 text-[#5EEAD4]"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p
                              dir="auto"
                              className={`text-sm leading-snug ${
                                active ? 'font-semibold text-[#0B3B3C]' : 'font-medium'
                              }`}
                            >
                              {lessonObj.title}
                            </p>
                            {lessonObj.videoUrl && (
                              <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#52797A]">
                                <FilmSlate size={12} aria-hidden="true" className="text-[#0D9488]" />
                                {t('player.videoIncluded')}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-4 py-3 text-xs text-[#52797A]">
                  {t('player.noLessonsInModule')}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div>
      {/* Screen reader status announcements for progress updates */}
      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>

      {/* Top Ocean Course Header */}
      <section className="ocean-grid-bg border-b border-[#1E6466] text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#99F6E4] hover:text-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            >
              <ArrowLeft size={15} aria-hidden="true" className="rtl:rotate-180" />
              {t('player.allCourses')}
            </Link>

            {canManage && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#2DD4BF]/50 bg-[#114B4D] px-3.5 py-2 text-xs font-semibold text-[#CCFBF1] hover:bg-[#155E61] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                >
                  <PencilSimple size={15} aria-hidden="true" />
                  {t('player.editCourse')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModuleModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#F59E0B] px-3.5 py-2 text-xs font-bold text-[#0B3B3C] hover:bg-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]"
                >
                  <Plus size={15} weight="bold" aria-hidden="true" />
                  {t('player.addModule')}
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h1 dir="auto" className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {course.title}
              </h1>
              <InstructorByline instructor={course.instructor} t={t} />
              <p dir="auto" className="mt-2 max-w-[68ch] text-sm leading-relaxed text-[#CCFBF1]/90 sm:text-base">
                {course.description}
              </p>
            </div>

            {!accessDenied && progressData && (
              <div className="rounded-xl border border-[#1E6466] bg-[#114B4D] p-4 lg:col-span-4">
                <div className="flex items-center justify-between gap-2 text-xs font-medium">
                  <span className="text-[#99F6E4]">{t('player.progressLabel')}</span>
                  <span className="font-mono-tabular font-semibold text-[#FBBF24]">
                    {completedCount}/{totalLessons} ({percentage}%)
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#0B3B3C]">
                  <div
                    className="h-full rounded-full bg-[#2DD4BF] transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {percentage === 100 && totalLessons > 0 && (
                  <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#6EE7B7]">
                    <SealCheck size={15} weight="fill" aria-hidden="true" />
                    {t('player.allCompleted')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <AlertBanner variant="error" className="mb-6" onDismiss={() => setError('')}>
            {tServer(error)}
          </AlertBanner>
        )}

        {/* Pre-Enrollment Gate or Active Workspace */}
        {accessDenied ? (
          <div className="rounded-2xl border border-[#99F6E4] bg-white p-8 text-center shadow-xs sm:p-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706]">
              <LockKey size={24} weight="duotone" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-[#0D2E2F]">
              {t('player.enrollGateTitle')}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#335C5D]">
              {t('player.enrollGateBody')}
            </p>
            {isStudent ? (
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrolling}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#0D9488] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {enrolling ? t('player.enrolling') : t('player.enrollBtn')}
                <ArrowRight size={16} weight="bold" aria-hidden="true" className="rtl:rotate-180" />
              </button>
            ) : (
              <p className="mt-5 text-xs font-medium text-[#52797A]">
                {t('player.enrollStudentOnly')}
              </p>
            )}
          </div>
        ) : (
          <div>
            {!isPopulated && modules.length > 0 && (
              <AlertBanner variant="warning" className="mb-6">
                {t('player.syncWarning')}
              </AlertBanner>
            )}

            {/* Mobile Syllabus Trigger */}
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <button
                type="button"
                aria-expanded={mobileSyllabusOpen}
                aria-controls="course-curriculum-sidebar"
                onClick={() => setMobileSyllabusOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-semibold text-[#0D2E2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              >
                {mobileSyllabusOpen ? (
                  <X size={16} aria-hidden="true" />
                ) : (
                  <List size={16} aria-hidden="true" />
                )}
                {mobileSyllabusOpen
                  ? t('player.hideCurriculum')
                  : t('player.showCurriculum')}
              </button>

              <span className="font-mono-tabular rounded bg-[#CCFBF1] px-2.5 py-1 text-xs font-semibold text-[#0F766E]">
                {formatCount(flattenedLessons.length, 'lesson')}
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
              {/* Curriculum Sidebar */}
              <aside
                id="course-curriculum-sidebar"
                aria-label={t('player.curriculum')}
                className={`${
                  mobileSyllabusOpen ? 'block' : 'hidden'
                } lg:sticky lg:top-20 lg:col-span-4 lg:block`}
              >
                <div className="mb-3 hidden items-center justify-between lg:flex">
                  <h2 className="font-display text-sm font-semibold text-[#0D2E2F]">
                    {t('player.curriculum')}
                  </h2>
                  <span className="font-mono-tabular text-xs font-medium text-[#0F766E]">
                    {formatCount(modules.length, 'module')} ·{' '}
                    {formatCount(flattenedLessons.length, 'lesson')}
                  </span>
                </div>
                {renderSyllabusList()}
              </aside>

              {/* Active Lesson Player Stage */}
              <section
                aria-label={t('player.activeLessonAria')}
                className="overflow-hidden rounded-2xl border border-[#99F6E4] bg-white shadow-xs lg:col-span-8"
              >
                <div className="h-1.5 w-full bg-gradient-to-r from-[#0D9488] to-[#F59E0B]" />
                <div className="p-6 sm:p-8">
                  {activeEntry ? (
                    <div>
                      {/* Deep Ocean Video Theater */}
                      {activeEntry.lesson.videoUrl && (
                        <div className="mb-6 overflow-hidden rounded-xl border border-[#1E6466] bg-[#0B3B3C]">
                          {isDemoPlaceholderVideo(activeEntry.lesson.videoUrl) ? (
                            <div className="flex aspect-video flex-col items-center justify-center px-6 text-center text-white">
                              <FilmSlate
                                size={36}
                                weight="duotone"
                                aria-hidden="true"
                                className="text-[#F59E0B]"
                              />
                              <p className="mt-3 font-display text-base font-semibold">
                                {t('player.placeholderTitle')}
                              </p>
                              <p className="mt-1 max-w-md text-xs leading-relaxed text-[#CCFBF1]/80">
                                {t('player.placeholderBody', {
                                  url: activeEntry.lesson.videoUrl,
                                })}
                              </p>
                            </div>
                          ) : (() => {
                              const embedUrl = getYouTubeEmbedUrl(
                                activeEntry.lesson.videoUrl
                              );
                              if (embedUrl) {
                                return (
                                  <div className="aspect-video w-full">
                                    <iframe
                                      src={embedUrl}
                                      title={activeEntry.lesson.title}
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      className="h-full w-full border-0"
                                    />
                                  </div>
                                );
                              }
                              return (
                                <div className="flex aspect-video flex-col items-center justify-center px-6 text-center text-white">
                                  <VideoCameraSlash
                                    size={34}
                                    weight="duotone"
                                    aria-hidden="true"
                                    className="text-[#99F6E4]"
                                  />
                                  <p className="mt-3 text-sm font-medium">
                                    {t('player.unsupportedVideo')}
                                  </p>
                                  <p className="mt-1 text-xs text-[#99F6E4]/80">
                                    {t('player.unsupportedVideoHint')}
                                  </p>
                                </div>
                              );
                            })()}
                        </div>
                      )}

                      {/* Lesson Header */}
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#CCFBF1] pb-5">
                        <div>
                          <span dir="auto" className="inline-block rounded-md bg-[#CCFBF1] px-2.5 py-0.5 text-xs font-semibold text-[#0F766E]">
                            {activeEntry.moduleTitle}
                          </span>
                          <h2 dir="auto" className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0D2E2F]">
                            {activeEntry.lesson.title}
                          </h2>
                          {activeEntry.lesson.description && (
                            <p dir="auto" className="mt-1.5 text-sm text-[#335C5D]">
                              {activeEntry.lesson.description}
                            </p>
                          )}
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingLesson(activeEntry.lesson)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-3 py-1.5 text-xs font-medium text-[#0D2E2F] hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                            >
                              <PencilSimple size={14} aria-hidden="true" />
                              {t('player.editLesson')}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'lesson',
                                  id: activeEntry.lessonId,
                                  moduleId: activeEntry.moduleId,
                                  title: activeEntry.lesson.title,
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-[#FEE2E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
                            >
                              <Trash size={14} aria-hidden="true" />
                              {t('common.delete')}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Reading Content */}
                      <div
                        dir="auto"
                        className="mt-6 max-w-[70ch] text-base leading-relaxed whitespace-pre-line text-[#134E4A]"
                      >
                        {activeEntry.lesson.content}
                      </div>

                      {/* Footer Controls */}
                      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#CCFBF1] pt-6">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!prevEntry}
                            onClick={() =>
                              prevEntry && selectLesson(prevEntry.lessonId, true)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-3.5 py-2 text-sm font-medium text-[#0D2E2F] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ArrowLeft size={15} aria-hidden="true" className="rtl:rotate-180" />
                            {t('player.prevLesson')}
                          </button>
                          <button
                            type="button"
                            disabled={!nextEntry}
                            onClick={() =>
                              nextEntry && selectLesson(nextEntry.lessonId, true)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-3.5 py-2 text-sm font-medium text-[#0D2E2F] transition-colors hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {t('player.nextLesson')}
                            <ArrowRight size={15} aria-hidden="true" className="rtl:rotate-180" />
                          </button>
                        </div>

                        {isStudent && progressData && (
                          <button
                            type="button"
                            aria-pressed={isLessonCompleted(activeEntry.lessonId)}
                            disabled={markingComplete}
                            onClick={() =>
                              handleToggleComplete(
                                activeEntry.lessonId,
                                activeEntry.lesson.title
                              )
                            }
                            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60 ${
                              isLessonCompleted(activeEntry.lessonId)
                                ? 'bg-[#D1FAE5] text-[#065F46] ring-1 ring-[#6EE7B7] hover:bg-[#A7F3D0]'
                                : 'bg-[#0D9488] text-white hover:bg-[#0F766E]'
                            }`}
                          >
                            {isLessonCompleted(activeEntry.lessonId) ? (
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
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#CCFBF1] text-[#0D9488]">
                        <BookOpen size={24} weight="duotone" aria-hidden="true" />
                      </div>
                      <h2 className="mt-4 font-display text-lg font-semibold text-[#0D2E2F]">
                        {t('player.noSelectionTitle')}
                      </h2>
                      <p className="mx-auto mt-1.5 max-w-md text-sm text-[#335C5D]">
                        {modules.length === 0
                          ? t('player.noSelectionModulesEmpty')
                          : t('player.noSelectionLessonsEmpty')}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateModuleModal
        show={showModuleModal}
        onHide={() => setShowModuleModal(false)}
        courseId={course?._id || course?.id}
        existingModules={modules}
        onModuleCreated={handleModuleCreated}
      />

      <CreateLessonModal
        show={showLessonModal}
        onHide={() => {
          setShowLessonModal(false);
          setActiveModuleId(null);
        }}
        moduleId={activeModuleId}
        existingLessons={
          modules.find((m) => (m._id || m.id) === activeModuleId)?.lesson || []
        }
        onLessonCreated={handleLessonCreated}
      />

      <EditCourseModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        course={course}
        onUpdate={(updatedCourse) =>
          setCourse((prev) => ({ ...prev, ...updatedCourse }))
        }
      />

      <EditModuleModal
        show={Boolean(editingModule)}
        onHide={() => setEditingModule(null)}
        moduleData={editingModule}
        onUpdate={(updatedMod) => {
          setCourse((prev) => ({
            ...prev,
            modules: (prev.modules || []).map((m) =>
              (m._id || m.id) === (updatedMod._id || updatedMod.id)
                ? { ...m, ...updatedMod }
                : m
            ),
          }));
        }}
      />

      <EditLessonModal
        show={Boolean(editingLesson)}
        onHide={() => setEditingLesson(null)}
        lessonData={editingLesson}
        onUpdate={(updatedLesson) => {
          setCourse((prev) => ({
            ...prev,
            modules: (prev.modules || []).map((m) => ({
              ...m,
              lesson: m.lesson
                ? m.lesson.map((l) =>
                    (l._id || l.id) === (updatedLesson._id || updatedLesson.id)
                      ? { ...l, ...updatedLesson }
                      : l
                  )
                : [],
            })),
          }));
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title={
          deleteTarget?.type === 'module'
            ? t('player.deleteModuleTitle')
            : t('player.deleteLessonTitle')
        }
        message={
          deleteTarget
            ? t('player.deleteConfirmMsg', { title: deleteTarget.title })
            : ''
        }
        confirmLabel={
          deleteTarget?.type === 'module'
            ? t('player.deleteModuleTitle')
            : t('player.deleteLessonTitle')
        }
      />
    </div>
  );
};
