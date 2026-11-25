import React, { useState } from 'react';
import { CheckCircle, Circle, Play, BookOpen } from '@phosphor-icons/react';

const SAMPLE_MODULES = [
  {
    id: 'm1',
    title: 'Module 1: Foundations',
    lessons: [
      {
        id: 'l1',
        title: 'Semantic Document Structure',
        duration: '12 min',
        summary:
          'Structuring accessible page landmarks, headings, and interactive controls before adding visual styles.',
        codeHint: '<main aria-labelledby="lesson-title">...</main>',
      },
      {
        id: 'l2',
        title: 'Layout Systems & Grid Rhythm',
        duration: '18 min',
        summary:
          'Composing two-column study workspaces using CSS Grid, sticky sidebars, and predictable spacing tokens.',
        codeHint: 'grid-template-columns: 300px minmax(0, 1fr);',
      },
    ],
  },
  {
    id: 'm2',
    title: 'Module 2: State & API Integration',
    lessons: [
      {
        id: 'l3',
        title: 'Tracking Lesson Completion',
        duration: '15 min',
        summary:
          'Persisting student progress per lesson and syncing percentage indicators from verified server records.',
        codeHint: 'POST /api/lessons/:id/complete -> { completed: true }',
      },
    ],
  },
];

export const HeroWorkspacePreview = () => {
  const allLessons = SAMPLE_MODULES.flatMap((m) => m.lessons);
  const [activeId, setActiveId] = useState('l2');
  const [completedIds, setCompletedIds] = useState(['l1']);

  const activeLesson = allLessons.find((l) => l.id === activeId) || allLessons[0];
  const completedCount = completedIds.length;
  const percentage = Math.round((completedCount / allLessons.length) * 100);
  const isCompleted = completedIds.includes(activeLesson.id);

  const toggleLesson = (id) => {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div
      className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-sm"
      aria-label="Interactive course workspace preview"
    >
      {/* Top workspace chrome */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] bg-[#F7F8FA] px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen size={16} weight="duotone" aria-hidden="true" className="text-[#1D4ED8]" />
          <span className="font-display text-sm font-semibold text-[#0F172A]">
            Complete Web Engineering
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono-tabular text-xs font-medium text-[#475569]">
            {completedCount}/{allLessons.length} complete ({percentage}%)
          </span>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-[#E2E8F0]">
            <div
              className="h-full rounded-full bg-[#059669] transition-all duration-200"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Split preview */}
      <div className="grid sm:grid-cols-12">
        {/* Curriculum sidebar */}
        <div className="border-b border-[#E2E8F0] bg-[#F7F8FA]/60 p-3 sm:col-span-5 sm:border-r sm:border-b-0">
          <p className="px-2 pb-2 text-xs font-semibold text-[#475569]">
            Interactive syllabus
          </p>
          <div className="space-y-3">
            {SAMPLE_MODULES.map((mod) => (
              <div key={mod.id}>
                <p className="px-2 text-[11px] font-semibold text-[#64748B]">
                  {mod.title}
                </p>
                <div className="mt-1 space-y-1">
                  {mod.lessons.map((lesson) => {
                    const active = lesson.id === activeLesson.id;
                    const done = completedIds.includes(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => setActiveId(lesson.id)}
                        className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                          active
                            ? 'bg-white font-semibold text-[#0F172A] ring-1 ring-[#CBD5E1]'
                            : 'text-[#475569] hover:bg-white/80 hover:text-[#0F172A]'
                        }`}
                      >
                        {done ? (
                          <CheckCircle
                            size={15}
                            weight="fill"
                            aria-hidden="true"
                            className="mt-0.5 shrink-0 text-[#059669]"
                          />
                        ) : (
                          <Circle
                            size={15}
                            aria-hidden="true"
                            className={`mt-0.5 shrink-0 ${
                              active ? 'text-[#1D4ED8]' : 'text-[#94A3B8]'
                            }`}
                          />
                        )}
                        <span className="min-w-0 flex-1 leading-snug">{lesson.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active lesson stage */}
        <div className="p-4 sm:col-span-7 sm:p-5">
          <div className="rounded-xl bg-[#0F172A] p-4 text-white">
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span className="inline-flex items-center gap-1.5 font-medium text-white">
                <Play size={13} weight="fill" aria-hidden="true" className="text-[#60A5FA]" />
                Lesson theater
              </span>
              <span className="font-mono-tabular">{activeLesson.duration}</span>
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 font-mono-tabular text-xs text-[#93C5FD]">
              {activeLesson.codeHint}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-display text-base font-semibold text-[#0F172A]">
              {activeLesson.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#475569]">
              {activeLesson.summary}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-3">
            <span className="text-[11px] text-[#64748B]">Try clicking lessons or toggling state</span>
            <button
              type="button"
              onClick={() => toggleLesson(activeLesson.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                isCompleted
                  ? 'bg-[#ECFDF5] text-[#065F46] ring-1 ring-[#A7F3D0]'
                  : 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF]'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle size={14} weight="fill" aria-hidden="true" />
                  Completed
                </>
              ) : (
                <>
                  <Circle size={14} aria-hidden="true" />
                  Mark complete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
