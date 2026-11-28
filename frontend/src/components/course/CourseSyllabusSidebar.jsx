import React from 'react';
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { ModuleLessonsList } from './SyllabusLessonList';

const getVisibilityClass = (focusMode, mobileSyllabusOpen) => {
  const mobileDisplay = mobileSyllabusOpen ? 'block' : 'hidden';
  if (focusMode) {
    return `${mobileDisplay} lg:hidden`;
  }
  return `${mobileDisplay} lg:sticky lg:top-20 lg:col-span-4 lg:block`;
};

const getEntityId = (entity, fallback) => entity._id || entity.id || fallback;

const countCompletedInModule = (lessons, isLessonCompleted) =>
  lessons.filter((l) => typeof l === 'object' && isLessonCompleted(l._id || l.id)).length;

const ModuleActions = ({ mod, mId, onEditModule, onDeleteModule, t }) => (
  <div className="flex shrink-0 items-center gap-2">
    <button
      type="button"
      onClick={() => onEditModule(mod)}
      aria-label={t('player.editModuleAria', { title: mod.title })}
      title={t('modal.editModuleTitle')}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-[#335C5D] hover:bg-white hover:text-[#0B3B3C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] lg:min-h-[36px] lg:min-w-[36px]"
    >
      <PencilSimple size={16} aria-hidden="true" />
    </button>
    <button
      type="button"
      onClick={() => onDeleteModule(mId, mod.title)}
      aria-label={t('player.deleteModuleAria', { title: mod.title })}
      title={t('player.deleteModuleTitle')}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-[#335C5D] hover:bg-[#FEF2F2] hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] lg:min-h-[36px] lg:min-w-[36px]"
    >
      <Trash size={16} aria-hidden="true" />
    </button>
  </div>
);

const ModuleProgressBar = ({ doneInMod, total }) => {
  const modPct = Math.round((doneInMod / total) * 100);
  const barColor = doneInMod === total ? 'bg-[#059669]' : 'bg-[#0F766E]';

  return (
    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/90">
      <div
        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
        style={{ width: `${modPct}%` }}
      />
    </div>
  );
};

const ModuleHeaderTop = ({
  mod,
  mIdx,
  mId,
  showProgress,
  doneInMod,
  totalLessons,
  canManage,
  onEditModule,
  onDeleteModule,
  t,
}) => (
  <div className="flex items-start justify-between gap-2">
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-block rounded bg-[#FEF3C7] px-2 py-0.5 font-mono-tabular text-[11px] font-semibold text-[#92400E]">
          {t('player.moduleLabel', { num: String(mIdx + 1).padStart(2, '0') })}
        </span>
        {showProgress && (
          <span className="font-mono-tabular text-[11px] font-semibold text-[#0F766E]">
            {doneInMod}/{totalLessons}
          </span>
        )}
      </div>
      <h3 className="mt-1.5 font-display text-sm font-semibold text-[#0D2E2F]">
        <bdi>{mod.title}</bdi>
      </h3>
    </div>

    {canManage && (
      <ModuleActions
        mod={mod}
        mId={mId}
        onEditModule={onEditModule}
        onDeleteModule={onDeleteModule}
        t={t}
      />
    )}
  </div>
);

const ModuleHeaderDetails = ({ description, mId, canManage, onAddLesson, t }) => (
  <>
    {description && (
      <p className="mt-1.5 text-xs leading-relaxed text-[#335C5D]">
        <bdi>{description}</bdi>
      </p>
    )}
    {canManage && (
      <button
        type="button"
        onClick={() => onAddLesson(mId)}
        className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#0F766E] hover:bg-white/70 hover:text-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
      >
        <Plus size={14} weight="bold" aria-hidden="true" />
        {t('player.addLesson')}
      </button>
    )}
  </>
);

const ModuleCard = ({
  mod,
  mIdx,
  showModuleProgress,
  canManage,
  selectedLessonId,
  isLessonCompleted,
  onSelectLesson,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  t,
}) => {
  if (typeof mod === 'string') {
    return (
      <div className="rounded-xl border border-[#99F6E4] bg-white p-3 text-xs text-[#335C5D]">
        Module ID: {mod}
      </div>
    );
  }

  const mId = getEntityId(mod, mIdx);
  const lessons = Array.isArray(mod.lesson) ? mod.lesson : [];
  const showProgress = showModuleProgress && lessons.length > 0;
  const doneInMod = showProgress ? countCompletedInModule(lessons, isLessonCompleted) : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xs">
      <div className="border-b border-[#CCFBF1] bg-[#E6F7F5] px-4 py-3 text-start">
        <ModuleHeaderTop
          mod={mod}
          mIdx={mIdx}
          mId={mId}
          showProgress={showProgress}
          doneInMod={doneInMod}
          totalLessons={lessons.length}
          canManage={canManage}
          onEditModule={onEditModule}
          onDeleteModule={onDeleteModule}
          t={t}
        />
        {showProgress && <ModuleProgressBar doneInMod={doneInMod} total={lessons.length} />}
        <ModuleHeaderDetails
          description={mod.description}
          mId={mId}
          canManage={canManage}
          onAddLesson={onAddLesson}
          t={t}
        />
      </div>

      <ModuleLessonsList
        lessons={lessons}
        selectedLessonId={selectedLessonId}
        isLessonCompleted={isLessonCompleted}
        onSelectLesson={onSelectLesson}
        t={t}
      />
    </div>
  );
};

const EmptyModulesState = ({ canManage, onAddModule, t }) => (
  <div className="rounded-xl border border-dashed border-[#5EEAD4] bg-white p-5 text-center">
    <p className="text-sm font-medium text-[#0D2E2F]">{t('player.noModulesTitle')}</p>
    <p className="mt-1 text-xs text-[#335C5D]">
      {canManage ? t('player.noModulesAdmin') : t('player.noModulesStudent')}
    </p>
    {canManage && (
      <button
        type="button"
        onClick={onAddModule}
        className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
      >
        <Plus size={14} weight="bold" aria-hidden="true" />
        {t('player.addModule')}
      </button>
    )}
  </div>
);

export const CourseSyllabusSidebar = ({
  modules,
  flattenedCount,
  canManage,
  isStudent,
  hasProgress,
  focusMode = false,
  selectedLessonId,
  isLessonCompleted,
  mobileSyllabusOpen,
  onSelectLesson,
  onAddModule,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  formatCount,
  t,
}) => {
  const showModuleProgress = Boolean(isStudent && hasProgress);
  const visibilityClass = getVisibilityClass(focusMode, mobileSyllabusOpen);

  return (
    <aside
      id="course-curriculum-sidebar"
      aria-label={t('player.curriculum')}
      className={visibilityClass}
    >
      <div className="mb-3 hidden items-center justify-between lg:flex">
        <h2 className="font-display text-sm font-semibold text-[#0D2E2F]">
          {t('player.curriculum')}
        </h2>
        <span className="font-mono-tabular text-xs font-medium text-[#0F766E]">
          {formatCount(modules.length, 'module')} · {formatCount(flattenedCount, 'lesson')}
        </span>
      </div>

      <div className="space-y-4">
        {modules.length === 0 ? (
          <EmptyModulesState canManage={canManage} onAddModule={onAddModule} t={t} />
        ) : (
          modules.map((mod, mIdx) => (
            <ModuleCard
              key={typeof mod === 'string' ? mod : getEntityId(mod, mIdx)}
              mod={mod}
              mIdx={mIdx}
              showModuleProgress={showModuleProgress}
              canManage={canManage}
              selectedLessonId={selectedLessonId}
              isLessonCompleted={isLessonCompleted}
              onSelectLesson={onSelectLesson}
              onEditModule={onEditModule}
              onDeleteModule={onDeleteModule}
              onAddLesson={onAddLesson}
              t={t}
            />
          ))
        )}
      </div>
    </aside>
  );
};
