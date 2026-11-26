import React, { useState } from 'react';
import { EnvelopeSimple, PaperPlaneTilt } from '@phosphor-icons/react';
import { useLanguage } from '../context/LanguageContext';
import { AlertBanner } from '../components/ui/AlertBanner';

export const Contact = () => {
  const { t } = useLanguage();
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormState({ name: '', email: '', message: '' });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="ocean-grid-bg rounded-2xl border border-[#1E6466] p-8 text-white lg:col-span-5">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            {t('contact.title')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#CCFBF1]/90">
            {t('contact.subtitle')}
          </p>

          <div className="mt-8 rounded-xl border border-[#1E6466] bg-[#114B4D] p-5">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-[#FBBF24]">
              <EnvelopeSimple size={18} weight="duotone" aria-hidden="true" />
              {t('contact.supportTitle')}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#CCFBF1]/85">
              {t('contact.supportBody')}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#99F6E4] bg-white shadow-xs lg:col-span-7">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0D9488] to-[#F59E0B]" />
          <div className="p-6 sm:p-8">
            {submitted && (
              <AlertBanner
                variant="success"
                className="mb-6"
                onDismiss={() => setSubmitted(false)}
              >
                {t('contact.sentSuccess')}
              </AlertBanner>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
                  >
                    {t('contact.nameLabel')}
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder={t('contact.namePlaceholder')}
                    className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-sm text-[#0D2E2F] placeholder:text-[#52797A]/70 focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
                  >
                    {t('contact.emailLabel')}
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    dir="ltr"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder={t('contact.emailPlaceholder')}
                    className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] placeholder:text-[#52797A]/70 focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
                >
                  {t('contact.messageLabel')}
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  required
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  placeholder={t('contact.messagePlaceholder')}
                  className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-sm text-[#0D2E2F] placeholder:text-[#52797A]/70 focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0D9488] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
              >
                <PaperPlaneTilt size={16} weight="bold" aria-hidden="true" className="rtl:-scale-x-100" />
                {t('contact.sendBtn')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
