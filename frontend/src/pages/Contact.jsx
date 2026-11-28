import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EnvelopeSimple, PaperPlaneTilt } from '@phosphor-icons/react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { AlertBanner } from '../components/ui/AlertBanner';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';

export const Contact = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, submitCount },
  } = useForm({ shouldFocusError: false });
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = () => {
    setSubmitted(true);
    addToast(t('contact.sentSuccess'), 'success');
    reset();
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

        <div className="overflow-hidden rounded-2xl border border-[#99F6E4] border-t-4 border-t-[#0F766E] bg-white shadow-xs lg:col-span-7">
          <div className="p-6 sm:p-8">
            <div className="space-y-4">
              {submitted && (
                <AlertBanner
                  variant="success"
                  onDismiss={() => setSubmitted(false)}
                >
                  {t('contact.sentSuccess')}
                </AlertBanner>
              )}

              <FormErrorSummary
                errors={errors}
                submitCount={submitCount}
                fieldMap={{
                  name: 'contact-name',
                  email: 'contact-email',
                  message: 'contact-message',
                }}
              />
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-5">
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
                    placeholder={t('contact.namePlaceholder')}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                    {...register('name', { required: t('register.nameRequired') })}
                    className={`min-h-[44px] w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0D2E2F] placeholder:text-[#4A6F70]/75 focus:outline-none focus:ring-2 ${
                      errors.name
                        ? 'border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                        : 'border-[#99F6E4] bg-[#F0FDFA]/40 focus:border-[#0D9488] focus:bg-white focus:ring-[#0D9488]/20'
                    }`}
                  />
                  {errors.name && (
                    <p id="contact-name-error" className="mt-1.5 text-xs font-medium text-[#DC2626]">
                      {errors.name.message}
                    </p>
                  )}
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
                    placeholder={t('contact.emailPlaceholder')}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'contact-email-error' : undefined}
                    {...register('email', {
                      required: t('auth.emailRequired'),
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: t('auth.emailInvalid'),
                      },
                    })}
                    className={`min-h-[44px] w-full rounded-lg border px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] placeholder:text-[#4A6F70]/75 rtl:placeholder:text-right focus:outline-none focus:ring-2 ${
                      errors.email
                        ? 'border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                        : 'border-[#99F6E4] bg-[#F0FDFA]/40 focus:border-[#0D9488] focus:bg-white focus:ring-[#0D9488]/20'
                    }`}
                  />
                  {errors.email && (
                    <p id="contact-email-error" className="mt-1.5 text-xs font-medium text-[#DC2626]">
                      {errors.email.message}
                    </p>
                  )}
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
                  placeholder={t('contact.messagePlaceholder')}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  {...register('message', { required: t('contact.messageLabel') })}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0D2E2F] placeholder:text-[#4A6F70]/75 focus:outline-none focus:ring-2 ${
                    errors.message
                      ? 'border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                      : 'border-[#99F6E4] bg-[#F0FDFA]/40 focus:border-[#0D9488] focus:bg-white focus:ring-[#0D9488]/20'
                  }`}
                />
                {errors.message && (
                  <p id="contact-message-error" className="mt-1.5 text-xs font-medium text-[#DC2626]">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
              >
                <PaperPlaneTilt size={16} weight="bold" aria-hidden="true" className="rtl:-scale-x-100" />
                {t('contact.sendBtn')}
              </button>

              <p className="text-center text-xs text-[#4A6F70]">
                {t('contact.previewNotice')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
