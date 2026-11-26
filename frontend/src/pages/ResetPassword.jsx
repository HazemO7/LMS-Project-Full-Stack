import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Eye, EyeSlash, Key } from '@phosphor-icons/react';
import { authAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { getPasswordRules } from '../utils/passwordRules';
import { AuthShell } from '../components/AuthShell';
import { AlertBanner } from '../components/ui/AlertBanner';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
          <div>
            <label
              htmlFor="reset-password"
              className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
            >
              {t('reset.newLabel')}
            </label>
            <div className="relative" dir="ltr">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('reset.newPlaceholder')}
                disabled={loading}
                aria-invalid={Boolean(errors.password)}
                {...register('password', getPasswordRules(t))}
                className={`w-full rounded-lg border py-2.5 pl-3.5 pr-11 text-left text-sm text-[#0D2E2F] placeholder:text-[#52797A]/70 focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                    : 'border-[#99F6E4] bg-[#F0FDFA]/40 focus:border-[#0D9488] focus:bg-white focus:ring-[#0D9488]/20'
                }`}
              />
              <button
                type="button"
                id="toggle-password-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-[#335C5D] hover:text-[#0B3B3C]"
              >
                {showPassword ? (
                  <EyeSlash size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs font-medium text-[#DC2626]">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="reset-confirm-password"
              className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
            >
              {t('reset.confirmLabel')}
            </label>
            <div className="relative" dir="ltr">
              <input
                id="reset-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('reset.confirmPlaceholder')}
                disabled={loading}
                aria-invalid={Boolean(errors.confirmPassword)}
                {...register('confirmPassword', {
                  required: t('reset.confirmRequired'),
                  validate: (v) => v === watchedPassword || t('reset.mismatch'),
                })}
                className={`w-full rounded-lg border py-2.5 pl-3.5 pr-11 text-left text-sm text-[#0D2E2F] placeholder:text-[#52797A]/70 focus:outline-none focus:ring-2 ${
                  errors.confirmPassword
                    ? 'border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                    : 'border-[#99F6E4] bg-[#F0FDFA]/40 focus:border-[#0D9488] focus:bg-white focus:ring-[#0D9488]/20'
                }`}
              />
              <button
                type="button"
                id="toggle-confirm-visibility"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? t('auth.hidePassword') : t('auth.showPassword')}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-[#335C5D] hover:text-[#0B3B3C]"
              >
                {showConfirm ? (
                  <EyeSlash size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs font-medium text-[#DC2626]">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <PasswordStrengthMeter password={watchedPassword} />

          <button
            type="submit"
            id="reset-submit-btn"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0D9488] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <Key size={16} weight="bold" aria-hidden="true" />
            {loading ? t('reset.submitting') : t('reset.submit')}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#335C5D] hover:text-[#0D2E2F]"
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
