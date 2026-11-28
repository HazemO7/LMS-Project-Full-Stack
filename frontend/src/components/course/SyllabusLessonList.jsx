import React from 'react';
import { CheckCircle, Circle, FilmSlate, Play } from '@phosphor-icons/react';

const LessonStatusIcon = ({ done, active }) => {
  if (done) {
    return (
      <CheckCircle
        size={17}
        weight="fill"
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-[#059669]"
      />
    );
  }
  if (active) {
    return (
      <Play
        size={16}
        weight="fill"
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-[#D97706]"
      />
    );
  }
  return (
    <Circle
      size={16}
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-[#5EEAD4]"
    />
  );
};

const LessonListItem = ({ lessonObj, selectedLessonId, isLessonCompleted, onSelectLesson, t }) => {
  if (typeof lessonObj === 'string') {
    return (
      <li className="px-4 py-2.5 text-xs text-[#4A6F70]">
        Lesson ID: {lessonObj}
      </li>
    );
  }

  const lId = lessonObj._id || lessonObj.id;
  const active = lId === selectedLessonId;
  const done = isLessonCompleted(lId);
  const buttonStyle = active
    ? 'border-s-4 border-s-[#0F766E] bg-[#CCFBF1]/60 text-[#0B3B3C]'
    : 'bg-white text-[#335C5D] hover:bg-[#F0FDFA]';

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelectLesson(lId)}
        className={`flex min-h-[48px] w-full items-start gap-2.5 px-4 py-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0D9488] ${buttonStyle}`}
      >
        <LessonStatusIcon done={done} active={active} />
        <div className="min-w-0 flex-1 text-start">
          <p className={`text-sm leading-snug ${active ? 'font-semibold text-[#0B3B3C]' : 'font-medium'}`}>
            <bdi>{lessonObj.title}</bdi>
          </p>
          {lessonObj.videoUrl && (
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#4A6F70]">
              <FilmSlate size={12} aria-hidden="true" className="text-[#0D9488]" />
              {t('player.videoIncluded')}
            </span>
          )}
        </div>
      </button>
    </li>
  );
};

export const ModuleLessonsList = ({
  lessons,
  selectedLessonId,
  isLessonCompleted,
  onSelectLesson,
  t,
}) => {
  if (lessons.length === 0) {
    return (
      <p className="px-4 py-3 text-xs text-[#4A6F70]">
        {t('player.noLessonsInModule')}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[#CCFBF1]">
      {lessons.map((lessonObj, lIdx) => {
        const key = typeof lessonObj === 'string'
          ? lessonObj
          : lessonObj._id || lessonObj.id || lIdx;
        return (
          <LessonListItem
            key={key}
            lessonObj={lessonObj}
            selectedLessonId={selectedLessonId}
            isLessonCompleted={isLessonCompleted}
            onSelectLesson={onSelectLesson}
            t={t}
          />
        );
      })}
    </ul>
  );
};
