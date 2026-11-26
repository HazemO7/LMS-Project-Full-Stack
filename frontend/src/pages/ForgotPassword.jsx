import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, EnvelopeOpen, PaperPlaneTilt } from '@phosphor-icons/react';
import { authAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { AuthShell } from '../components/AuthShell';
import { AlertBanner } from '../components/ui/AlertBanner';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';

export const ForgotPassword = () => {
  const { t, tServer } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(data.email.trim());
      setSuccess(
        res.message || 'If an account exists, a password reset email has been sent.'
      );
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t('forgot.title')}
      subtitle={t('forgot.subtitle')}
      asideTitle={t('forgot.asideTitle')}
      asideBody={t('forgot.asideBody')}
      asidePoints={[t('forgot.aside1'), t('forgot.aside2')]}
    >
      <div className="space-y-4">
        {success && <AlertBanner variant="success">{tServer(success)}</AlertBanner>}
        {error && (
          <AlertBanner variant="error" onDismiss={() => setError('')}>
            {tServer(error)}
          </AlertBanner>
        )}
        <FormErrorSummary
          errors={errors}
          submitCount={submitCount}
          fieldMap={{ email: 'forgot-email' }}
        />
      </div>

      {!success ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="forgot-email"
              className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
            >
              {t('auth.emailLabel')}
            </label>
            <input
              id="forgot-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder={t('auth.emailPlaceholder')}
              disabled={loading}
              aria-invalid={Boolean(errors.email)}
              {...register('email', {
                required: t('auth.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('auth.emailInvalid'),
                },
              })}
              className={`w-full rounded-lg border px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] placeholder:text-[#52797A]/70 focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                  : 'border-[#99F6E4] bg-[#F0FDFA]/40 focus:border-[#0D9488] focus:bg-white focus:ring-[#0D9488]/20'
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs font-medium text-[#DC2626]">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            id="forgot-submit-btn"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0D9488] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <PaperPlaneTilt size={16} weight="bold" aria-hidden="true" className="rtl:-scale-x-100" />
            {loading ? t('forgot.submitting') : t('forgot.submit')}
          </button>

          <p className="text-center text-sm text-[#335C5D]">
            {t('forgot.remembered')}{' '}
            <Link
              to="/login"
              className="font-semibold text-[#0F766E] hover:text-[#D97706]"
            >
              {t('forgot.backSignIn')}
            </Link>
          </p>
        </form>
      ) : (
        <div className="mt-6 rounded-xl border border-[#99F6E4] bg-[#F0FDFA] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#D1FAE5] text-[#059669]">
            <EnvelopeOpen size={24} weight="duotone" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-[#0D2E2F]">
            {t('forgot.inboxTitle')}
          </h2>
          <p className="mt-2 text-sm text-[#335C5D]">
            {t('forgot.inboxBodyPrefix')} <strong>{t('forgot.inboxDuration')}</strong>{' '}
            {t('forgot.inboxBodySuffix')}
          </p>
          <p className="mt-2 text-xs text-[#52797A]">{t('forgot.inboxSpam')}</p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-medium text-[#0D2E2F] hover:bg-[#CCFBF1]"
          >
            <ArrowLeft size={15} aria-hidden="true" className="rtl:rotate-180" />
            {t('forgot.backSignIn')}
          </Link>
        </div>
      )}
    </AuthShell>
  );
};
