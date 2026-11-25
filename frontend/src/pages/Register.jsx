import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeSlash, UserPlus } from '@phosphor-icons/react';
import { authAPI } from '../services/api';
import { PASSWORD_RULES } from '../utils/passwordRules';
import { AuthShell } from '../components/AuthShell';
import { AlertBanner } from '../components/ui/AlertBanner';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';

export const Register = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

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
      title="Create account"
      subtitle="Register as a student to enroll in courses and track progress."
      asideTitle="Start learning with a clear syllabus."
      asideBody="Student accounts get instant access to course enrollment, lesson checklists, and progress tracking."
      asidePoints={[
        'Enroll in published engineering and design courses',
        'Save completion state across every module and lesson',
        'Strong password policy enforced automatically on signup',
      ]}
    >
      {error && (
        <AlertBanner variant="error" className="mb-5" onDismiss={() => setError('')}>
          {error}
        </AlertBanner>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <label
            htmlFor="register-name"
            className="mb-1.5 block text-sm font-medium text-[#0F172A]"
          >
            Full name
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Alex Rivera"
            disabled={loading}
            aria-invalid={Boolean(errors.name)}
            {...register('name', {
              required: 'Full name is required',
              validate: (value) =>
                value.trim().length >= 3 || 'Name must be at least 3 characters',
              maxLength: { value: 50, message: 'Name cannot exceed 50 characters' },
            })}
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 ${
              errors.name
                ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                : 'border-[#CBD5E1] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/20'
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
            className="mb-1.5 block text-sm font-medium text-[#0F172A]"
          >
            Email address
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="alex@example.com"
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
          <label
            htmlFor="register-password"
            className="mb-1.5 block text-sm font-medium text-[#0F172A]"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
              disabled={loading}
              aria-invalid={Boolean(errors.password)}
              {...register('password', PASSWORD_RULES)}
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

          <div className="mt-3">
            <PasswordStrengthMeter password={watchedPassword} />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <UserPlus size={17} weight="bold" aria-hidden="true" />
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-center text-sm text-[#475569]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#1D4ED8] hover:text-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};
