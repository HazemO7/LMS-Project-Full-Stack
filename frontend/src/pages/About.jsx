import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Books, LockKey, Path } from '@phosphor-icons/react';
import { useLanguage } from '../context/LanguageContext';

export const About = () => {
  const { t } = useLanguage();

  const architectureItems = [
    {
      icon: Books,
      iconWrap: 'bg-[#CCFBF1] text-[#0F766E]',
      borderAccent: 'border-t-[#0D9488]',
      title: t('about.f1Title'),
      description: t('about.f1Body'),
    },
    {
      icon: LockKey,
      iconWrap: 'bg-[#FEF3C7] text-[#B45309]',
      borderAccent: 'border-t-[#D97706]',
      title: t('about.f2Title'),
      description: t('about.f2Body'),
    },
    {
      icon: Path,
      iconWrap: 'bg-[#D1FAE5] text-[#065F46]',
      borderAccent: 'border-t-[#059669]',
      title: t('about.f3Title'),
      description: t('about.f3Body'),
    },
  ];

  return (
    <div>
      <section className="ocean-grid-bg border-b border-[#1E6466] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:items-center lg:py-16 lg:px-8">
          <div className="lg:col-span-7">
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t('about.title')}
            </h1>
            <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[#CCFBF1]/90">
              {t('about.p1')}
            </p>
            <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[#99F6E4]/80">
              {t('about.p2')}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-5 py-2.5 text-sm font-bold text-[#0B3B3C] transition-colors hover:bg-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]"
              >
                {t('about.browse')}
                <ArrowRight size={16} weight="bold" aria-hidden="true" className="rtl:rotate-180" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center rounded-lg border border-[#2DD4BF]/50 bg-[#114B4D] px-5 py-2.5 text-sm font-semibold text-[#CCFBF1] transition-colors hover:bg-[#155E61] hover:text-white"
              >
                {t('about.contact')}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[#1E6466] bg-[#114B4D] p-6 sm:p-8 lg:col-span-5">
            <h2 className="font-display text-lg font-semibold text-[#FBBF24]">
              {t('about.archTitle')}
            </h2>
            <dl className="mt-5 divide-y divide-[#1E6466]">
              <div className="flex items-center justify-between py-3 text-sm">
                <dt className="text-[#99F6E4]">{t('about.archFrontend')}</dt>
                <dd dir="ltr" className="font-mono-tabular font-medium text-white">
                  React 19 + Vite
                </dd>
              </div>
              <div className="flex items-center justify-between py-3 text-sm">
                <dt className="text-[#99F6E4]">{t('about.archApi')}</dt>
                <dd dir="ltr" className="font-mono-tabular font-medium text-white">
                  Node.js + Express
                </dd>
              </div>
              <div className="flex items-center justify-between py-3 text-sm">
                <dt className="text-[#99F6E4]">{t('about.archDb')}</dt>
                <dd dir="ltr" className="font-mono-tabular font-medium text-white">
                  MongoDB + Mongoose
                </dd>
              </div>
              <div className="flex items-center justify-between py-3 text-sm">
                <dt className="text-[#99F6E4]">{t('about.archAuth')}</dt>
                <dd dir="ltr" className="font-mono-tabular font-medium text-white">
                  JWT + Bcrypt + Joi
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {architectureItems.map((item) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={item.title}
                className={`rounded-xl border border-[#99F6E4] border-t-4 ${item.borderAccent} bg-white p-6 shadow-xs`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconWrap}`}>
                  <ItemIcon size={20} weight="duotone" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-[#0D2E2F]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#335C5D]">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
