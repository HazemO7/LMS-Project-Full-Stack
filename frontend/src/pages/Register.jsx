import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeSlash, UserPlus } from '@phosphor-icons/react';
import { authAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { getPasswordRules } from '../utils/passwordRules';
import { AuthShell } from '../components/AuthShell';
import { AlertBanner } from '../components/ui/AlertBanner';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';

export const Register = () => {
  const navigate = useNavigate();
  const { t, tServer } = useLanguage();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, submitCount },
  } = useForm({ shouldFocusError: false });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const watchedPassword = watch('password', '');

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      await authAPI.register({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      asideTitle={t('register.asideTitle')}
      asideBody={t('register.asideBody')}
      asidePoints={[t('register.aside1'), t('register.aside2'), t('register.aside3')]}
    >
      {error && (
        <AlertBanner variant="error" className="mb-5" onDismiss={() => setError('')}>
          {tServer(error)}
        </AlertBanner>
      )}

      <div className="mb-5">
        <FormErrorSummary
          errors={errors}
          submitCount={submitCount}
          fieldMap={{
            name: 'register-name',
            email: 'register-email',
            password: 'register-password',
          }}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label
            htmlFor="register-name"
            className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
          >
            {t('register.nameLabel')}
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder={t('register.namePlaceholder')}
            disabled={loading}
            aria-invalid={Boolean(errors.name)}
            {...register('name', {
              required: t('register.nameRequired'),
              validate: (value) => value.trim().length >= 3 || t('register.nameMin'),
              maxLength: { value: 50, message: t('register.nameMax') },
            })}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0D2E2F] placeholder:text-[#52797A]/70 focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                : 'border-[#99F6E4] bg-[#F0FDFA]/40 focus:border-[#0D9488] focus:bg-white focus:ring-[#0D9488]/20'
            }`}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs font-medium text-[#DC2626]">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
          >
            {t('auth.emailLabel')}
          </label>
          <input
            id="register-email"
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

        <div>
          <label
            htmlFor="register-password"
            className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
          >
            {t('auth.passwordLabel')}
          </label>
          <div className="relative" dir="ltr">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={t('register.passwordPlaceholder')}
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
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-[#335C5D] hover:text-[#0B3B3C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
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

          <div className="mt-3">
            <PasswordStrengthMeter password={watchedPassword} />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0D9488] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <UserPlus size={17} weight="bold" aria-hidden="true" />
          {loading ? t('register.submitting') : t('register.submit')}
        </button>

        <p className="text-center text-sm text-[#335C5D]">
          {t('register.hasAccount')}{' '}
          <Link
            to="/login"
            className="font-semibold text-[#0F766E] hover:text-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            {t('register.signInLink')}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};
