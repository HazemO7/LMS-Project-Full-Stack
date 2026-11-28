import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckSquareOffset, ShieldCheck } from '@phosphor-icons/react';
import { coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { HeroWorkspacePreview } from '../components/HeroWorkspacePreview';

const CARD_ACCENTS = [
  { topBar: 'bg-[#0D9488]', pill: 'bg-[#CCFBF1] text-[#0F766E]' },
  { topBar: 'bg-[#D97706]', pill: 'bg-[#FEF3C7] text-[#92400E]' },
  { topBar: 'bg-[#0284C7]', pill: 'bg-[#E0F2FE] text-[#0369A1]' },
];

export const Home = () => {
  const { userToken } = useAuth();
  const { t, formatCount } = useLanguage();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const workflowSteps = [
    {
      step: '01',
      badgeClass: 'bg-[#CCFBF1] text-[#0F766E] ring-[#99F6E4]',
      borderAccent: 'border-t-[#0D9488]',
      title: t('home.step1Title'),
      description: t('home.step1Body'),
    },
    {
      step: '02',
      badgeClass: 'bg-[#FEF3C7] text-[#92400E] ring-[#FDE68A]',
      borderAccent: 'border-t-[#D97706]',
      title: t('home.step2Title'),
      description: t('home.step2Body'),
    },
    {
      step: '03',
      badgeClass: 'bg-[#D1FAE5] text-[#065F46] ring-[#A7F3D0]',
      borderAccent: 'border-t-[#059669]',
      title: t('home.step3Title'),
      description: t('home.step3Body'),
    },
  ];

  useEffect(() => {
    let active = true;
    coursesAPI
      .getAll(1, 3, '')
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : res.courses || res.data || [];
        setFeaturedCourses(list.slice(0, 3));
      })
      .catch(() => {
        if (active) setFeaturedCourses([]);
      })
      .finally(() => {
        if (active) setLoadingCourses(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="ocean-grid-bg border-b border-[#1E6466] text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-20 lg:px-8">
          <div className="lg:col-span-6">
            <h1 className="font-display text-4xl font-bold tracking-[-0.025em] text-white sm:text-5xl lg:leading-[1.12]">
              {t('home.heroTitle')}
            </h1>
            <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-[#CCFBF1]/90 sm:text-lg">
              {t('home.heroBody')}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-5 py-3 text-sm font-bold text-[#0B3B3C] transition-colors hover:bg-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B3B3C]"
              >
                {t('home.browseCourses')}
                <ArrowRight size={16} weight="bold" aria-hidden="true" className="rtl:rotate-180" />
              </Link>
              <Link
                to={userToken ? '/profile' : '/register'}
                className="inline-flex items-center gap-2 rounded-lg border border-[#2DD4BF]/50 bg-[#114B4D] px-5 py-3 text-sm font-semibold text-[#CCFBF1] transition-colors hover:border-[#2DD4BF] hover:bg-[#155E61] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
              >
                {userToken ? t('home.viewAccount') : t('home.createStudent')}
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-[#1E6466] pt-6">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-[#99F6E4]">
                  <BookOpen size={14} aria-hidden="true" className="text-[#F59E0B]" />
                  {t('home.specStructureLabel')}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-white">
                  {t('home.specStructureValue')}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-[#99F6E4]">
                  <CheckSquareOffset size={14} aria-hidden="true" className="text-[#2DD4BF]" />
                  {t('home.specProgressLabel')}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-white">
                  {t('home.specProgressValue')}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-[#99F6E4]">
                  <ShieldCheck size={14} aria-hidden="true" className="text-[#F59E0B]" />
                  {t('home.specPermissionsLabel')}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-white">
                  {t('home.specPermissionsValue')}
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-6">
            <HeroWorkspacePreview />
          </div>
        </div>
      </section>

      {/* Featured Catalog Strip */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#99F6E4] pb-5">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#0D2E2F]">
              {t('home.publishedTitle')}
            </h2>
            <p className="mt-1 text-sm text-[#335C5D]">
              {t('home.publishedSubtitle')}
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#CCFBF1] px-4 py-2 text-sm font-semibold text-[#0F766E] transition-colors hover:bg-[#99F6E4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            {t('home.viewFullCatalog')}
            <ArrowRight size={15} weight="bold" aria-hidden="true" className="rtl:rotate-180" />
          </Link>
        </div>

        {loadingCourses ? (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-xl border border-[#99F6E4] bg-white p-6"
              />
            ))}
          </div>
        ) : featuredCourses.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {featuredCourses.map((course, idx) => {
              const id = course._id || course.id;
              const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0;
              const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];
              return (
                <article
                  key={id}
                  className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#0D9488] hover:shadow-md"
                >
                  <div>
                    <div className={`h-1.5 w-full ${accent.topBar}`} />
                    <div className="p-6">
                      <span
                        className={`inline-block rounded-md px-2.5 py-1 font-mono-tabular text-xs font-semibold ${accent.pill}`}
                      >
                        {formatCount(moduleCount, 'module')}
                      </span>
                      <h3 className="mt-3 text-start font-display text-lg font-semibold leading-snug text-[#0D2E2F]">
                        <bdi>{course.title}</bdi>
                      </h3>
                      <p className="mt-2 line-clamp-3 text-start text-sm leading-relaxed text-[#335C5D]">
                        <bdi>{course.description}</bdi>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[#CCFBF1] bg-[#F0FDFA]/50 px-6 py-3">
                    <Link
                      to={`/course/${id}`}
                      className="inline-flex min-h-[40px] items-center gap-1.5 py-1.5 text-sm font-semibold text-[#0F766E] hover:text-[#0B3B3C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                    >
                      {userToken ? t('home.openCourse') : t('home.signInToView')}
                      <ArrowRight size={14} weight="bold" aria-hidden="true" className="rtl:rotate-180" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-[#99F6E4] bg-white p-8 text-center">
            <p className="text-sm text-[#335C5D]">{t('home.offlineNote')}</p>
            <Link
              to="/courses"
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#115E59]"
            >
              {t('home.openCatalog')}
            </Link>
          </div>
        )}
      </section>

      {/* Sequential 01 / 02 / 03 Workflow */}
      <section className="border-t border-[#99F6E4] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#0D2E2F]">
              {t('home.howTitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#335C5D]">
              {t('home.howSubtitle')}
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {workflowSteps.map((item) => (
              <div
                key={item.step}
                className={`rounded-xl border border-[#CCFBF1] border-t-4 ${item.borderAccent} bg-[#F0FDFA]/45 p-6 sm:p-7`}
              >
                <span
                  className={`inline-flex rounded-md px-2.5 py-1 font-mono-tabular text-xs font-bold ring-1 ${item.badgeClass}`}
                >
                  {item.step}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-[#0D2E2F]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#335C5D]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
