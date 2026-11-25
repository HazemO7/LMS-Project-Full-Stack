import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeSlash, SignIn } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { AuthShell } from '../components/AuthShell';
import { AlertBanner } from '../components/ui/AlertBanner';

export const Login = () => {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [countdown, setCountdown] = useState('');

  const fromPath = location.state?.from?.pathname || '/courses';
  const redirectedFromProtected = Boolean(location.state?.from);
  const justRegistered = Boolean(location.state?.registered);

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
      title="Sign in"
      subtitle="Access your enrolled courses, modules, and progress."
      asideTitle="Pick up right where you stopped."
      asideBody="Your active course enrollments, completed lessons, and role permissions stay synced across sessions."
      asidePoints={[
        'Role-based dashboards for students, instructors, and admins',
        'Protected enrollment and lesson progress persistence',
        'Brute-force lockout protection on repeated failed attempts',
      ]}
    >
      <div className="space-y-4">
        {justRegistered && (
          <AlertBanner variant="success">
            Account created successfully. Sign in with your email and password.
          </AlertBanner>
        )}

        {redirectedFromProtected && !justRegistered && (
          <AlertBanner variant="info">
            Please sign in to access this page.
          </AlertBanner>
        )}

        {error && !lockedUntil && (
          <AlertBanner variant="error" onDismiss={() => setError('')}>
            <span>{error}</span>
            {remainingAttempts !== null && (
              <span className="mt-1 block font-mono-tabular text-xs font-medium">
                {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining before temporary lockout.
              </span>
            )}
          </AlertBanner>
        )}

        {lockedUntil && (
          <AlertBanner variant="warning">
            <p className="font-semibold">Account temporarily locked</p>
            <p className="mt-0.5">
              Multiple failed login attempts detected. Try again in{' '}
              <span className="font-mono-tabular font-semibold">{countdown}</span>.
            </p>
          </AlertBanner>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-sm font-medium text-[#0F172A]"
          >
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            disabled={loading}
            aria-invalid={Boolean(errors.email)}
            {...register('email', {
              required: 'Email address is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            })}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 ${
              errors.email
                ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                : 'border-[#CBD5E1] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/20'
            }`}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs font-medium text-[#DC2626]">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-[#0F172A]"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-[#1D4ED8] hover:text-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              disabled={loading}
              aria-invalid={Boolean(errors.password)}
              {...register('password', {
                required: 'Password is required',
              })}
              className={`w-full rounded-lg border px-3.5 py-2.5 pr-11 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                  : 'border-[#CBD5E1] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-[#64748B] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
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

        <button
          type="submit"
          disabled={loading || Boolean(lockedUntil)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <SignIn size={17} weight="bold" aria-hidden="true" />
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-[#475569]">
          New to Foundry?{' '}
          <Link
            to="/register"
            className="font-semibold text-[#1D4ED8] hover:text-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};
