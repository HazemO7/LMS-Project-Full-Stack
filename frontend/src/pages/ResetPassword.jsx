import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Key } from '@phosphor-icons/react';
import { authAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { getPasswordRules } from '../utils/passwordRules';
import { AuthShell } from '../components/AuthShell';
import { AlertBanner } from '../components/ui/AlertBanner';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';
import { PasswordInput } from '../components/ui/PasswordInput';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t, tServer } = useLanguage();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, submitCount },
  } = useForm({ shouldFocusError: false });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const watchedPassword = watch('password', '');

  const onSubmit = async (data) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token, data.password);
      setSuccess(res.message || 'Password reset successfully.');
      reset();
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(
        err.message || 'Password reset failed. The link may be invalid or expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t('reset.title')}
      subtitle={t('reset.subtitle')}
      asideTitle={t('reset.asideTitle')}
      asideBody={t('reset.asideBody')}
    >
      <div className="space-y-4">
        {success && (
          <AlertBanner variant="success">
            <p>{tServer(success)}</p>
            <p className="mt-1 text-xs">{t('reset.redirecting')}</p>
          </AlertBanner>
        )}

        {error && (
          <AlertBanner variant="error" onDismiss={() => setError('')}>
            <p>{tServer(error)}</p>
            {(error.toLowerCase().includes('invalid') ||
              error.toLowerCase().includes('expired')) && (
              <Link
                to="/forgot-password"
                className="mt-1.5 inline-block text-xs font-semibold underline"
              >
                {t('reset.requestAnother')}
              </Link>
            )}
          </AlertBanner>
        )}

        <FormErrorSummary
          errors={errors}
          submitCount={submitCount}
          fieldMap={{
            password: 'reset-password',
            confirmPassword: 'reset-confirm-password',
          }}
        />
      </div>

      {!success ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-5">
          <div className="space-y-3">
            <PasswordInput
              id="reset-password"
              label={t('reset.newLabel')}
              autoComplete="new-password"
              placeholder={t('reset.newPlaceholder')}
              disabled={loading}
              error={errors.password}
              registration={register('password', getPasswordRules(t))}
              showLabel={t('auth.showPassword')}
              hideLabel={t('auth.hidePassword')}
            />
            <PasswordStrengthMeter password={watchedPassword} />
          </div>

          <PasswordInput
            id="reset-confirm-password"
            label={t('reset.confirmLabel')}
            autoComplete="new-password"
            placeholder={t('reset.confirmPlaceholder')}
            disabled={loading}
            error={errors.confirmPassword}
            registration={register('confirmPassword', {
              required: t('reset.confirmRequired'),
              validate: (v) => v === watchedPassword || t('reset.mismatch'),
            })}
            showLabel={t('auth.showPassword')}
            hideLabel={t('auth.hidePassword')}
          />

          <button
            type="submit"
            id="reset-submit-btn"
            disabled={loading}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <Key size={16} weight="bold" aria-hidden="true" />
            {loading ? t('reset.submitting') : t('reset.submit')}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 py-1.5 text-sm font-medium text-[#335C5D] hover:text-[#0D2E2F]"
            >
              <ArrowLeft size={14} aria-hidden="true" className="rtl:rotate-180" />
              {t('forgot.backSignIn')}
            </Link>
          </div>
        </form>
      ) : (
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-medium text-[#0D2E2F] hover:bg-[#CCFBF1]"
          >
            <ArrowLeft size={15} aria-hidden="true" className="rtl:rotate-180" />
            {t('reset.goSignIn')}
          </Link>
        </div>
      )}
    </AuthShell>
  );
};
