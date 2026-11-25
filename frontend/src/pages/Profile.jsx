import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Check, Eye, EyeSlash, Key, ShieldCheck, UserCircle } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { authAPI, usersAPI } from '../services/api';
import { PASSWORD_RULES } from '../utils/passwordRules';
import { AlertBanner } from '../components/ui/AlertBanner';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';

export const Profile = () => {
  const { currentUser, userLoading, refreshUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset: resetPasswordForm,
    formState: { errors },
  } = useForm();

  const watchedNewPassword = watch('newPassword', '');

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
      });
    }
  }, [currentUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      await usersAPI.updateMe({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });
      await refreshUser();
      setProfileSuccess('Account details updated.');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (data) => {
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const res = await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess(
        res.message || 'Password updated. Signing you out so you can sign in with your new password...'
      );
      resetPasswordForm();
      setTimeout(() => {
        logoutUser();
        navigate('/login', { state: { passwordChanged: true } });
      }, 1500);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (userLoading && !currentUser) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#1D4ED8]"
          role="status"
          aria-label="Loading profile"
        />
      </div>
    );
  }

  const roleBadgeClass =
    currentUser?.role === 'admin'
      ? 'bg-[#FEF2F2] text-[#991B1B] ring-[#FECACA]'
      : currentUser?.role === 'instructor'
      ? 'bg-[#EFF6FF] text-[#1E40AF] ring-[#BFDBFE]'
      : 'bg-[#ECFDF5] text-[#065F46] ring-[#A7F3D0]';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-12 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF1F6] text-[#1D4ED8]">
            <UserCircle size={28} weight="duotone" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">
              Account settings
            </h1>
            <p className="text-sm text-[#475569]">
              Manage your identity details and account security.
            </p>
          </div>
        </div>

        {currentUser?.role && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2">
            <ShieldCheck size={16} weight="duotone" aria-hidden="true" className="text-[#475569]" />
            <span className="text-xs font-medium text-[#64748B]">Role</span>
            <span
              className={`rounded-md px-2 py-0.5 font-mono-tabular text-xs font-semibold capitalize ring-1 ${roleBadgeClass}`}
            >
              {currentUser.role}
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Account identity */}
        <section
          aria-labelledby="profile-identity-heading"
          className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-7 lg:col-span-6"
        >
          <h2
            id="profile-identity-heading"
            className="font-display text-lg font-semibold text-[#0F172A]"
          >
            Profile details
          </h2>
          <p className="mt-1 text-xs text-[#475569]">
            Changes apply immediately across your active session.
          </p>

          <div className="mt-4 space-y-3">
            {profileError && (
              <AlertBanner variant="error" onDismiss={() => setProfileError('')}>
                {profileError}
              </AlertBanner>
            )}
            {profileSuccess && (
              <AlertBanner variant="success" onDismiss={() => setProfileSuccess('')}>
                {profileSuccess}
              </AlertBanner>
            )}
          </div>

          <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="profile-name"
                className="mb-1.5 block text-sm font-medium text-[#0F172A]"
              >
                Full name
              </label>
              <input
                id="profile-name"
                type="text"
                required
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
              />
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="mb-1.5 block text-sm font-medium text-[#0F172A]"
              >
                Email address
              </label>
              <input
                id="profile-email"
                type="email"
                required
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <Check size={16} weight="bold" aria-hidden="true" />
              {profileSaving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </section>

        {/* Password update */}
        <section
          aria-labelledby="profile-password-heading"
          className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-7 lg:col-span-6"
        >
          <h2
            id="profile-password-heading"
            className="font-display text-lg font-semibold text-[#0F172A]"
          >
            Password &amp; security
          </h2>
          <p className="mt-1 text-xs text-[#475569]">
            Changing your password invalidates existing tokens and requires signing in again.
          </p>

          <div className="mt-4 space-y-3">
            {passwordError && (
              <AlertBanner variant="error" onDismiss={() => setPasswordError('')}>
                {passwordError}
              </AlertBanner>
            )}
            {passwordSuccess && (
              <AlertBanner variant="success">{passwordSuccess}</AlertBanner>
            )}
          </div>

          <form
            onSubmit={handleSubmit(handlePasswordSubmit)}
            noValidate
            className="mt-5 space-y-4"
          >
            <div>
              <label
                htmlFor="current-password"
                className="mb-1.5 block text-sm font-medium text-[#0F172A]"
              >
                Current password
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={passwordSaving}
                  aria-invalid={Boolean(errors.currentPassword)}
                  {...register('currentPassword', {
                    required: 'Current password is required',
                  })}
                  className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-[#0F172A] focus:outline-none focus:ring-2 ${
                    errors.currentPassword
                      ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                      : 'border-[#CBD5E1] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#64748B] hover:text-[#0F172A]"
                >
                  {showCurrent ? <EyeSlash size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-xs font-medium text-[#DC2626]">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="mb-1.5 block text-sm font-medium text-[#0F172A]"
              >
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  disabled={passwordSaving}
                  aria-invalid={Boolean(errors.newPassword)}
                  {...register('newPassword', PASSWORD_RULES)}
                  className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-[#0F172A] focus:outline-none focus:ring-2 ${
                    errors.newPassword
                      ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                      : 'border-[#CBD5E1] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? 'Hide new password' : 'Show new password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#64748B] hover:text-[#0F172A]"
                >
                  {showNew ? <EyeSlash size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-xs font-medium text-[#DC2626]">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="mb-1.5 block text-sm font-medium text-[#0F172A]"
              >
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirm-new-password"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  disabled={passwordSaving}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  {...register('confirmPassword', {
                    required: 'Please confirm your new password',
                    validate: (v) => v === watchedNewPassword || 'Passwords do not match',
                  })}
                  className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-[#0F172A] focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                      : 'border-[#CBD5E1] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#64748B] hover:text-[#0F172A]"
                >
                  {showConfirm ? <EyeSlash size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs font-medium text-[#DC2626]">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <PasswordStrengthMeter password={watchedNewPassword} />

            <button
              type="submit"
              disabled={passwordSaving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#0F172A] bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <Key size={16} weight="bold" aria-hidden="true" />
              {passwordSaving ? 'Updating password...' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
