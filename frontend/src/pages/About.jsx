import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Books, LockKey, Path } from '@phosphor-icons/react';

const ARCHITECTURE_ITEMS = [
  {
    icon: Books,
    title: 'Hierarchical curriculum',
    description:
      'Instructors organize courses into ordered modules and individual lessons with reading notes and embedded video lectures.',
  },
  {
    icon: LockKey,
    title: 'Role-verified access control',
    description:
      'Every endpoint enforces JWT authentication and role checks across students, instructors, and administrators.',
  },
  {
    icon: Path,
    title: 'Persistent progress tracking',
    description:
      'Completed lessons are recorded per enrollment so students always resume from where they left off.',
  },
];

export const About = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#0F172A] sm:text-4xl">
            Built for clear curricula and measurable learning.
          </h1>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[#475569]">
            Foundry is a full-stack learning management workspace designed around the actual study flow: discovering courses, enrolling securely, reading lesson notes alongside video lectures, and tracking completion step by step.
          </p>
          <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[#475569]">
            Instead of burying students inside nested accordions or distracting visual effects, the platform separates course discovery from an uncluttered lesson player while giving instructors direct curriculum editing tools.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2"
            >
              Browse courses
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-lg border border-[#CBD5E1] bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F7F8FA]"
            >
              Contact the team
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 lg:col-span-5">
          <h2 className="font-display text-lg font-semibold text-[#0F172A]">
            System architecture
          </h2>
          <dl className="mt-5 divide-y divide-[#E2E8F0]">
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-[#475569]">Frontend client</dt>
              <dd className="font-mono-tabular font-medium text-[#0F172A]">React 19 + Vite</dd>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-[#475569]">API runtime</dt>
              <dd className="font-mono-tabular font-medium text-[#0F172A]">Node.js + Express</dd>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-[#475569]">Database</dt>
              <dd className="font-mono-tabular font-medium text-[#0F172A]">MongoDB + Mongoose</dd>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <dt className="text-[#475569]">Authentication</dt>
              <dd className="font-mono-tabular font-medium text-[#0F172A]">JWT + Bcrypt + Joi</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {ARCHITECTURE_ITEMS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="rounded-xl border border-[#E2E8F0] bg-white p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#1D4ED8]">
              <Icon size={20} weight="duotone" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-[#0F172A]">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#475569]">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
