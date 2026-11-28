import React, { useState } from 'react';
import { BookOpen, CheckCircle, Circle, Play } from '@phosphor-icons/react';
import { useLanguage } from '../context/LanguageContext';

const SAMPLE_BY_LANG = {
  en: [
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
  ],
  ar: [
    {
      id: 'm1',
      title: 'الوحدة 1: الأساسيات',
      lessons: [
        {
          id: 'l1',
          title: 'بناء الصفحة الدلالي وإتاحة الوصول',
          duration: '12 دقيقة',
          summary:
            'ترتيب العناوين والعناصر التفاعلية بشكل واضح وقابل للقراءة قبل إضافة التنسيقات البصرية.',
          codeHint: '<main aria-labelledby="lesson-title">...</main>',
        },
        {
          id: 'l2',
          title: 'أنظمة التخطيط والشبكات المرنة',
          duration: '18 دقيقة',
          summary:
            'تصميم مساحة دراسة من عمودين باستخدام CSS Grid وقائمة جانبية ثابتة للمحتوى.',
          codeHint: 'grid-template-columns: 300px minmax(0, 1fr);',
        },
      ],
    },
    {
      id: 'm2',
      title: 'الوحدة 2: ربط الحالة والـ API',
      lessons: [
        {
          id: 'l3',
          title: 'حفظ تقدم الطالب لكل درس',
          duration: '15 دقيقة',
          summary:
            'تسجيل الدروس المكتملة ومزامنة نسبة الإنجاز الفعلية مباشرة مع قاعدة البيانات.',
          codeHint: 'POST /api/lessons/:id/complete -> { completed: true }',
        },
      ],
    },
  ],
};

export const HeroWorkspacePreview = () => {
  const { lang, t } = useLanguage();
  const sampleModules = SAMPLE_BY_LANG[lang] || SAMPLE_BY_LANG.en;
  const allLessons = sampleModules.flatMap((m) => m.lessons);
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
      className="overflow-hidden rounded-2xl border border-[#2DD4BF]/40 bg-white shadow-xl"
      aria-label={t('preview.aria')}
    >
      {/* Top workspace chrome */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#99F6E4] bg-[#CCFBF1]/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen size={17} weight="duotone" aria-hidden="true" className="text-[#0F766E]" />
          <span className="font-display text-sm font-semibold text-[#0B3B3C]">
            {t('preview.courseTitle')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono-tabular text-xs font-semibold text-[#0F766E]">
            {t('preview.progress', {
              done: completedCount,
              total: allLessons.length,
              pct: percentage,
            })}
          </span>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-[#99F6E4]">
            <div
              className="h-full rounded-full bg-[#D97706] transition-all duration-200"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Split preview */}
      <div className="grid sm:grid-cols-12">
        {/* Curriculum sidebar */}
        <div className="border-b border-[#CCFBF1] bg-[#F0FDFA] p-3 sm:col-span-5 sm:border-e sm:border-b-0">
          <p className="px-2 pb-2 text-xs font-semibold text-[#0F766E]">
            {t('preview.syllabus')}
          </p>
          <div className="space-y-3">
            {sampleModules.map((mod) => (
              <div key={mod.id}>
                <p className="px-2 text-[11px] font-semibold text-[#52797A]">
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
                        className={`flex min-h-[44px] w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-xs transition-colors sm:min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                          active
                            ? 'bg-white font-semibold text-[#0B3B3C] ring-1 ring-[#0D9488]'
                            : 'text-[#335C5D] hover:bg-white/80 hover:text-[#0B3B3C]'
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
                              active ? 'text-[#D97706]' : 'text-[#5EEAD4]'
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
          <div className="rounded-xl border border-[#1E6466] bg-[#0B3B3C] p-4 text-white">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#CCFBF1]">
                <Play size={13} weight="fill" aria-hidden="true" className="text-[#F59E0B]" />
                {t('preview.theater')}
              </span>
              <span className="rounded bg-[#114B4D] px-2 py-0.5 font-mono-tabular text-[11px] font-medium text-[#FBBF24]">
                {activeLesson.duration}
              </span>
            </div>
            <div
              dir="ltr"
              className="mt-4 rounded-lg border border-[#2DD4BF]/25 bg-[#114B4D] px-3 py-2.5 text-left font-mono-tabular text-xs text-[#5EEAD4]"
            >
              {activeLesson.codeHint}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-display text-base font-semibold text-[#0D2E2F]">
              {activeLesson.title}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#335C5D]">
              {activeLesson.summary}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#CCFBF1] pt-3">
            <span className="text-[11px] text-[#52797A]">{t('preview.hint')}</span>
            <button
              type="button"
              aria-pressed={isCompleted}
              onClick={() => toggleLesson(activeLesson.id)}
              className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                isCompleted
                  ? 'bg-[#D1FAE5] text-[#065F46] ring-1 ring-[#6EE7B7]'
                  : 'bg-[#0F766E] text-white hover:bg-[#115E59]'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle size={14} weight="fill" aria-hidden="true" />
                  {t('preview.completed')}
                </>
              ) : (
                <>
                  <Circle size={14} aria-hidden="true" />
                  {t('preview.markComplete')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
