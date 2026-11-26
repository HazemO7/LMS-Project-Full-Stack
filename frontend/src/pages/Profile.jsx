import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Check, Eye, EyeSlash, Key, ShieldCheck, UserCircle } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authAPI, usersAPI } from '../services/api';
import { getPasswordRules } from '../utils/passwordRules';
import { AlertBanner } from '../components/ui/AlertBanner';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';

export const Profile = () => {
  const { currentUser, userLoading, refreshUser, logoutUser } = useAuth();
  const { t, tServer } = useLanguage();
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    specialty: '',
    bio: '',
  });
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
    formState: { errors, submitCount },
  } = useForm({ shouldFocusError: false });

  const watchedNewPassword = watch('newPassword', '');

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        specialty: currentUser.specialty || '',
        bio: currentUser.bio || '',
      });
    }
  }, [currentUser]);

  const mustRotatePw = Boolean(currentUser?.mustChangePassword);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (mustRotatePw) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const payload = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      };
      if (currentUser?.role && currentUser.role !== 'student') {
        payload.specialty = profileForm.specialty.trim();
        payload.bio = profileForm.bio.trim();
      }
      await usersAPI.updateMe(payload);
      await refreshUser();
      setProfileSuccess(t('profile.updated'));
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
      await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess(t('profile.pwUpdatedMsg'));
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
          className="h-7 w-7 animate-spin rounded-full border-2 border-[#99F6E4] border-t-[#0D9488]"
          role="status"
          aria-label={t('common.loading')}
        />
      </div>
    );
  }

  const roleBadgeClass =
    currentUser?.role === 'super_admin'
      ? 'bg-[#EDE9FE] text-[#5B21B6] ring-[#DDD6FE]'
      : currentUser?.role === 'admin'
      ? 'bg-[#FEF2F2] text-[#991B1B] ring-[#FECACA]'
      : currentUser?.role === 'instructor'
      ? 'bg-[#FEF3C7] text-[#92400E] ring-[#FDE68A]'
      : 'bg-[#D1FAE5] text-[#065F46] ring-[#A7F3D0]';

  return (
    <div>
      <section className="ocean-grid-bg border-b border-[#1E6466] text-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#114B4D] text-[#2DD4BF] ring-1 ring-[#2DD4BF]/30">
              <UserCircle size={28} weight="duotone" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {t('profile.title')}
              </h1>
              <p className="text-sm text-[#CCFBF1]/85">{t('profile.subtitle')}</p>
            </div>
          </div>

          {currentUser?.role && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#1E6466] bg-[#114B4D] px-3.5 py-2">
              <ShieldCheck size={16} weight="duotone" aria-hidden="true" className="text-[#F59E0B]" />
              <span className="text-xs font-medium text-[#99F6E4]">{t('profile.roleLabel')}</span>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${roleBadgeClass}`}
              >
                {t(`role.${currentUser.role}`)}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10 lg:px-8">
        {currentUser?.mustChangePassword && (
          <AlertBanner variant="warning" className="mb-6">
            <strong className="block font-semibold">{t('profile.forcePwBannerTitle')}</strong>
            <span className="mt-0.5 block text-xs">{t('profile.forcePwBannerBody')}</span>
          </AlertBanner>
        )}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Account identity */}
          <section
            aria-labelledby="profile-identity-heading"
            className="overflow-hidden rounded-2xl border border-[#99F6E4] bg-white shadow-xs lg:col-span-6"
          >
            <div className="h-1.5 w-full bg-[#0D9488]" />
            <div className="p-6 sm:p-7">
              <h2
                id="profile-identity-heading"
                className="font-display text-lg font-semibold text-[#0D2E2F]"
              >
                {t('profile.detailsTitle')}
              </h2>
              <p className="mt-1 text-xs text-[#335C5D]">{t('profile.detailsNote')}</p>

              <div className="mt-4 space-y-3">
                {mustRotatePw && (
                  <AlertBanner variant="info">
                    {t('profile.detailsLockedUntilPwChange')}
                  </AlertBanner>
                )}
                {profileError && (
                  <AlertBanner variant="error" onDismiss={() => setProfileError('')}>
                    {tServer(profileError)}
                  </AlertBanner>
                )}
                {profileSuccess && (
                  <AlertBanner variant="success" onDismiss={() => setProfileSuccess('')}>
                    {profileSuccess}
                  </AlertBanner>
                )}
              </div>

              <form onSubmit={handleProfileSubmit} className="mt-5">
                <fieldset
                  disabled={mustRotatePw || profileSaving}
                  className="space-y-4 disabled:opacity-60"
                >
                <div>
                  <label
                    htmlFor="profile-name"
                    className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
                  >
                    {t('profile.nameLabel')}
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-email"
                    className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
                  >
                    {t('profile.emailLabel')}
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    dir="ltr"
                    required
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
                  />
                </div>

                {currentUser?.role && currentUser.role !== 'student' && (
                  <>
                    <div>
                      <label
                        htmlFor="profile-specialty"
                        className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
                      >
                        {t('profile.specialtyLabel')}
                      </label>
                      <input
                        id="profile-specialty"
                        type="text"
                        value={profileForm.specialty}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, specialty: e.target.value }))
                        }
                        placeholder={t('profile.specialtyPlaceholder')}
                        className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="profile-bio"
                        className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
                      >
                        {t('profile.bioLabel')}
                      </label>
                      <textarea
                        id="profile-bio"
                        rows={3}
                        value={profileForm.bio}
                        onChange={(e) =>
                          setProfileForm((prev) => ({ ...prev, bio: e.target.value }))
                        }
                        placeholder={t('profile.bioPlaceholder')}
                        className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={mustRotatePw || profileSaving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0D9488] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  <Check size={16} weight="bold" aria-hidden="true" />
                  {profileSaving ? t('common.saving') : t('profile.saveBtn')}
                </button>
                </fieldset>
              </form>
            </div>
          </section>

          {/* Password update */}
          <section
            aria-labelledby="profile-password-heading"
            className="overflow-hidden rounded-2xl border border-[#99F6E4] bg-white shadow-xs lg:col-span-6"
          >
            <div className="h-1.5 w-full bg-[#D97706]" />
            <div className="p-6 sm:p-7">
              <h2
                id="profile-password-heading"
                className="font-display text-lg font-semibold text-[#0D2E2F]"
              >
                {t('profile.securityTitle')}
              </h2>
              <p className="mt-1 text-xs text-[#335C5D]">{t('profile.securityNote')}</p>

              <div className="mt-4 space-y-3">
                {passwordError && (
                  <AlertBanner variant="error" onDismiss={() => setPasswordError('')}>
                    {tServer(passwordError)}
                  </AlertBanner>
                )}
                {passwordSuccess && (
                  <AlertBanner variant="success">{passwordSuccess}</AlertBanner>
                )}
                <FormErrorSummary
                  errors={errors}
                  submitCount={submitCount}
                  fieldMap={{
                    currentPassword: 'current-password',
                    newPassword: 'new-password',
                    confirmPassword: 'confirm-new-password',
                  }}
                />
              </div>

              <form
                onSubmit={handleSubmit(handlePasswordSubmit)}
                noValidate
                className="mt-5 space-y-4"
              >
                <div>
                  <label
                    htmlFor="current-password"
                    className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
                  >
                    {t('profile.currentPw')}
                  </label>
                  <div className="relative" dir="ltr">
                    <input
                      id="current-password"
                      type={showCurrent ? 'text' : 'password'}
                      autoComplete="current-password"
                      disabled={passwordSaving}
                      aria-invalid={Boolean(errors.currentPassword)}
                      {...register('currentPassword', {
                        required: t('profile.currentPwRequired'),
                      })}
                      className={`w-full rounded-lg border py-2.5 pl-3.5 pr-10 text-left text-sm text-[#0D2E2F] focus:outline-none focus:ring-2 ${
                        errors.currentPassword
                          ? 'border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                          : 'border-[#99F6E4] bg-[#F0FDFA]/40 focus:border-[#0D9488] focus:bg-white focus:ring-[#0D9488]/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      aria-label={showCurrent ? t('auth.hidePassword') : t('auth.showPassword')}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-[#335C5D] hover:text-[#0B3B3C]"
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
                    className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
                  >
                    {t('profile.newPw')}
                  </label>
                  <div className="relative" dir="ltr">
                    <input
                      id="new-password"
                      type={showNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      disabled={passwordSaving}
                      aria-invalid={Boolean(errors.newPassword)}
                      {...register('newPassword', getPasswordRules(t))}
                      className={`w-full rounded-lg border py-2.5 pl-3.5 pr-10 text-left text-sm text-[#0D2E2F] focus:outline-none focus:ring-2 ${
                        errors.newPassword
                          ? 'border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                          : 'border-[#99F6E4] bg-[#F0FDFA]/40 focus:border-[#0D9488] focus:bg-white focus:ring-[#0D9488]/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? t('auth.hidePassword') : t('auth.showPassword')}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-[#335C5D] hover:text-[#0B3B3C]"
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
                    className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
                  >
                    {t('profile.confirmPw')}
                  </label>
                  <div className="relative" dir="ltr">
                    <input
                      id="confirm-new-password"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      disabled={passwordSaving}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      {...register('confirmPassword', {
                        required: t('reset.confirmRequired'),
                        validate: (v) => v === watchedNewPassword || t('reset.mismatch'),
                      })}
                      className={`w-full rounded-lg border py-2.5 pl-3.5 pr-10 text-left text-sm text-[#0D2E2F] focus:outline-none focus:ring-2 ${
                        errors.confirmPassword
                          ? 'border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-[#DC2626]/20'
                          : 'border-[#99F6E4] bg-[#F0FDFA]/40 focus:border-[#0D9488] focus:bg-white focus:ring-[#0D9488]/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? t('auth.hidePassword') : t('auth.showPassword')}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-[#335C5D] hover:text-[#0B3B3C]"
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B3B3C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#114B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  <Key size={16} weight="bold" aria-hidden="true" className="text-[#F59E0B]" />
                  {passwordSaving ? t('profile.updatingPw') : t('profile.updatePwBtn')}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
