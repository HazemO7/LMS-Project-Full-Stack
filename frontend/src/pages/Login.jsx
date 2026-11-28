import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { SignIn } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authAPI } from '../services/api';
import { AuthShell } from '../components/AuthShell';
import { AlertBanner } from '../components/ui/AlertBanner';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';
import { PasswordInput } from '../components/ui/PasswordInput';

export const Login = () => {
  const { loginUser } = useAuth();
  const { t, tServer } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm({ shouldFocusError: false });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [countdown, setCountdown] = useState('');

  const fromPath = location.state?.from?.pathname || '/courses';
  const redirectedFromProtected = Boolean(location.state?.from);
  const justRegistered = Boolean(location.state?.registered);
  const passwordChanged = Boolean(location.state?.passwordChanged);

  useEffect(() => {
    if (!lockedUntil) {
      setCountdown('');
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(lockedUntil).getTime() - Date.now();
      if (difference <= 0) {
        setLockedUntil(null);
        setCountdown('');
        setError('');
        return null;
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const initial = calculateTimeLeft();
    if (!initial) return;
    setCountdown(initial);

    const interval = setInterval(() => {
      const next = calculateTimeLeft();
      if (next) setCountdown(next);
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  useEffect(() => {
    if (error && !lockedUntil) {
      const timer = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [error, lockedUntil]);

  const onSubmit = async (data) => {
    setError('');
    setRemainingAttempts(null);
    setLoading(true);
    try {
      const res = await authAPI.login(data);
      loginUser(res.token);
      navigate(fromPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
      if (err.status === 401 && err.remainingAttempts !== undefined) {
        setRemainingAttempts(err.remainingAttempts);
      }
      if (err.status === 423 && err.lockedUntil) {
        setLockedUntil(err.lockedUntil);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      asideTitle={t('login.asideTitle')}
      asideBody={t('login.asideBody')}
      asidePoints={[t('login.aside1'), t('login.aside2'), t('login.aside3')]}
    >
      <div className="space-y-4">
        {justRegistered && (
          <AlertBanner variant="success">{t('login.justRegistered')}</AlertBanner>
        )}

        {passwordChanged && (
          <AlertBanner variant="success">{t('login.passwordChanged')}</AlertBanner>
        )}

        {redirectedFromProtected && !justRegistered && !passwordChanged && (
          <AlertBanner variant="info">{t('login.redirected')}</AlertBanner>
        )}

        {error && !lockedUntil && (
          <AlertBanner variant="error" onDismiss={() => setError('')}>
            <span>{tServer(error)}</span>
            {remainingAttempts !== null && (
              <span className="mt-1 block font-mono-tabular text-xs font-medium">
                {remainingAttempts === 1
                  ? t('login.attemptRemainingOne')
                  : t('login.attemptsRemaining', { count: remainingAttempts })}
              </span>
            )}
          </AlertBanner>
        )}

        {lockedUntil && (
          <AlertBanner variant="warning">
            <p className="font-semibold">{t('login.lockedTitle')}</p>
            <p className="mt-0.5">
              {t('login.lockedBody')}{' '}
              <span dir="ltr" className="font-mono-tabular font-semibold">
                {countdown}
              </span>
              .
            </p>
          </AlertBanner>
        )}

        <FormErrorSummary
          errors={errors}
          submitCount={submitCount}
          fieldMap={{ email: 'login-email', password: 'login-password' }}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
          >
            {t('auth.emailLabel')}
          </label>
          <input
            id="login-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            placeholder={t('auth.emailPlaceholder')}
            disabled={loading}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
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
            <p id="login-email-error" className="mt-1.5 text-xs font-medium text-[#DC2626]">
              {errors.email.message}
            </p>
          )}
        </div>

        <PasswordInput
          id="login-password"
          label={t('auth.passwordLabel')}
          labelExtra={
            <Link
              to="/forgot-password"
              className="inline-block py-1 text-xs font-semibold text-[#0F766E] hover:text-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
            >
              {t('login.forgot')}
            </Link>
          }
          autoComplete="current-password"
          placeholder={t('login.passwordPlaceholder')}
          disabled={loading}
          error={errors.password}
          registration={register('password', {
            required: t('auth.passwordRequired'),
          })}
          showLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
        />

        <button
          type="submit"
          disabled={loading || Boolean(lockedUntil)}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <SignIn size={17} weight="bold" aria-hidden="true" className="rtl:rotate-180" />
          {loading ? t('login.submitting') : t('login.submit')}
        </button>

        <p className="text-center text-sm text-[#335C5D]">
          {t('login.newUser')}{' '}
          <Link
            to="/register"
            className="inline-block py-1.5 font-semibold text-[#0F766E] hover:text-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            {t('login.createOne')}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};
