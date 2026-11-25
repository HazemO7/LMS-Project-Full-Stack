import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, EnvelopeOpen, PaperPlaneTilt } from '@phosphor-icons/react';
import { authAPI } from '../services/api';
import { AuthShell } from '../components/AuthShell';
import { AlertBanner } from '../components/ui/AlertBanner';

export const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
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
      title="Reset your password"
      subtitle="Enter your registered email and we will send you a time-limited reset link."
      asideTitle="Account recovery"
      asideBody="Reset links are cryptographically hashed on the server and expire automatically after 15 minutes."
      asidePoints={[
        'For security, responses never reveal whether an email is registered',
        'Reset links expire after 15 minutes',
      ]}
    >
      <div className="space-y-4">
        {success && <AlertBanner variant="success">{success}</AlertBanner>}
        {error && (
          <AlertBanner variant="error" onDismiss={() => setError('')}>
            {error}
          </AlertBanner>
        )}
      </div>

      {!success ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="forgot-email"
              className="mb-1.5 block text-sm font-medium text-[#0F172A]"
            >
              Email address
            </label>
            <input
              id="forgot-email"
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

          <button
            type="submit"
            id="forgot-submit-btn"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <PaperPlaneTilt size={16} weight="bold" aria-hidden="true" />
            {loading ? 'Sending reset link...' : 'Send reset link'}
          </button>

          <p className="text-center text-sm text-[#475569]">
            Remembered your password?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#1D4ED8] hover:text-[#1E40AF]"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      ) : (
        <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-[#F7F8FA] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
            <EnvelopeOpen size={24} weight="duotone" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold text-[#0F172A]">
            Check your inbox
          </h2>
          <p className="mt-2 text-sm text-[#475569]">
            Open the link in the email within <strong>15 minutes</strong> to choose a new password.
          </p>
          <p className="mt-2 text-xs text-[#64748B]">
            Did not receive an email? Check your spam folder or verify the address you entered.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#EEF1F6]"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      )}
    </AuthShell>
  );
};
