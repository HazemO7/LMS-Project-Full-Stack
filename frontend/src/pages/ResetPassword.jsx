import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Eye, EyeSlash, Key } from '@phosphor-icons/react';
import { authAPI } from '../services/api';
import { PASSWORD_RULES } from '../utils/passwordRules';
import { AuthShell } from '../components/AuthShell';
import { AlertBanner } from '../components/ui/AlertBanner';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

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
      title="Set a new password"
      subtitle="Choose a strong new password for your Foundry account."
      asideTitle="Password policy"
      asideBody="Your new password immediately invalidates older sessions and replaces your reset token."
    >
      <div className="space-y-4">
        {success && (
          <AlertBanner variant="success">
            <p>{success}</p>
            <p className="mt-1 text-xs">Redirecting to sign in...</p>
          </AlertBanner>
        )}

        {error && (
          <AlertBanner variant="error" onDismiss={() => setError('')}>
            <p>{error}</p>
            {(error.toLowerCase().includes('invalid') ||
              error.toLowerCase().includes('expired')) && (
              <Link
                to="/forgot-password"
                className="mt-1.5 inline-block text-xs font-semibold underline"
              >
                Request a new reset link
              </Link>
            )}
          </AlertBanner>
        )}
      </div>

      {!success ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="reset-password"
              className="mb-1.5 block text-sm font-medium text-[#0F172A]"
            >
              New password
            </label>
            <div className="relative">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter new password"
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
                id="toggle-password-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-[#64748B] hover:text-[#0F172A]"
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
              className="mb-1.5 block text-sm font-medium text-[#0F172A]"
            >
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="reset-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                disabled={loading}
                aria-invalid={Boolean(errors.confirmPassword)}
                {...register('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (v) => v === watchedPassword || 'Passwords do not match',
                })}
                className={`w-full rounded-lg border px-3.5 py-2.5 pr-11 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 ${
                  errors.confirmPassword
                    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                    : 'border-[#CBD5E1] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/20'
                }`}
              />
              <button
                type="button"
                id="toggle-confirm-visibility"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-[#64748B] hover:text-[#0F172A]"
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <Key size={16} weight="bold" aria-hidden="true" />
            {loading ? 'Resetting password...' : 'Reset password'}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#475569] hover:text-[#0F172A]"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back to sign in
            </Link>
          </div>
        </form>
      ) : (
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F7F8FA]"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Go to sign in
          </Link>
        </div>
      )}
    </AuthShell>
  );
};
