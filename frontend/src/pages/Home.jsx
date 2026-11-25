import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckSquareOffset, ShieldCheck } from '@phosphor-icons/react';
import { coursesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HeroWorkspacePreview } from '../components/HeroWorkspacePreview';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Explore the catalog and enroll',
    description:
      'Browse published engineering curricula openly, inspect course summaries, and enroll in one click once signed in.',
  },
  {
    step: '02',
    title: 'Learn in a focused lesson workspace',
    description:
      'Navigate module by module with a persistent syllabus sidebar, dedicated video theater, and clean reading notes.',
  },
  {
    step: '03',
    title: 'Track completion across every module',
    description:
      'Mark individual lessons complete and monitor verified course progress percentages tied directly to your account.',
  },
];

export const Home = () => {
  const { userToken } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

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
      <section className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-20 lg:px-8">
          <div className="lg:col-span-6">
            <h1 className="font-display text-4xl font-bold tracking-[-0.025em] text-[#0F172A] sm:text-5xl lg:leading-[1.08]">
              Structured technical courses built for uninterrupted study.
            </h1>
            <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-[#475569] sm:text-lg">
              Foundry organizes lessons into clear modules, tracks every completed step, and gives instructors direct authoring tools without visual clutter.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
              >
                Browse courses
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Link>
              <Link
                to={userToken ? '/profile' : '/register'}
                className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-5 py-3 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F7F8FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                {userToken ? 'View my account' : 'Create student account'}
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-[#E2E8F0] pt-6">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
                  <BookOpen size={14} aria-hidden="true" className="text-[#1D4ED8]" />
                  Structure
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#0F172A]">
                  Modules &amp; lessons
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
                  <CheckSquareOffset size={14} aria-hidden="true" className="text-[#059669]" />
                  Progress
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#0F172A]">
                  Lesson-level sync
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
                  <ShieldCheck size={14} aria-hidden="true" className="text-[#1D4ED8]" />
                  Permissions
                </dt>
                <dd className="mt-1 text-sm font-semibold text-[#0F172A]">
                  Role-verified RBAC
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
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E2E8F0] pb-5">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A]">
              Published courses
            </h2>
            <p className="mt-1 text-sm text-[#475569]">
              Open any syllabus to inspect its overview or enroll as a student.
            </p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] hover:text-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            View full catalog
            <ArrowRight size={15} weight="bold" aria-hidden="true" />
          </Link>
        </div>

        {loadingCourses ? (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-44 animate-pulse rounded-xl border border-[#E2E8F0] bg-white p-6"
              />
            ))}
          </div>
        ) : featuredCourses.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {featuredCourses.map((course) => {
              const id = course._id || course.id;
              const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0;
              return (
                <article
                  key={id}
                  className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-white p-6 transition-colors hover:border-[#CBD5E1]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono-tabular text-xs font-medium text-[#1D4ED8]">
                        {moduleCount} {moduleCount === 1 ? 'module' : 'modules'}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-[#0F172A]">
                      {course.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#475569]">
                      {course.description}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-[#E2E8F0] pt-4">
                    <Link
                      to={`/course/${id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1D4ED8] hover:text-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                    >
                      {userToken ? 'Open course' : 'Sign in to view'}
                      <ArrowRight size={14} weight="bold" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-white p-8 text-center">
            <p className="text-sm text-[#475569]">
              Browse the course catalog to view available courses once the API server is running.
            </p>
            <Link
              to="/courses"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-[#F7F8FA] px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#EEF1F6]"
            >
              Open catalog
            </Link>
          </div>
        )}
      </section>

      {/* Sequential 01 / 02 / 03 Workflow */}
      <section className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A]">
              How Foundry works
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#475569]">
              Every course follows a clear hierarchy from enrollment to verified lesson completion.
            </p>
          </div>

          <div className="mt-8 grid divide-y divide-[#E2E8F0] rounded-xl border border-[#E2E8F0] md:grid-cols-3 md:divide-x md:divide-y-0">
            {WORKFLOW_STEPS.map((item) => (
              <div key={item.step} className="p-6 sm:p-7">
                <span className="font-mono-tabular text-xs font-semibold text-[#1D4ED8]">
                  {item.step}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-[#0F172A]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#475569]">
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
