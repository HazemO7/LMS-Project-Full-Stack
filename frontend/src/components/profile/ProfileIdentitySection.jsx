import React, { useEffect, useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { usersAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { AlertBanner } from '../ui/AlertBanner';

const EMPTY_PROFILE_FORM = { name: '', email: '', specialty: '', bio: '' };

const toProfileFormState = (user) => {
  if (!user) return EMPTY_PROFILE_FORM;
  return {
    name: user.name || '',
    email: user.email || '',
    specialty: user.specialty || '',
    bio: user.bio || '',
  };
};

const StaffProfileFields = ({ role, profileForm, setProfileForm, t }) => {
  if (!role || role === 'student') return null;
  return (
    <>
      <div>
        <label htmlFor="profile-specialty" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
          {t('profile.specialtyLabel')}
        </label>
        <input
          id="profile-specialty"
          type="text"
          value={profileForm.specialty}
          onChange={(e) => setProfileForm((prev) => ({ ...prev, specialty: e.target.value }))}
          placeholder={t('profile.specialtyPlaceholder')}
          className="min-h-[44px] w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
        />
      </div>
      <div>
        <label htmlFor="profile-bio" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
          {t('profile.bioLabel')}
        </label>
        <textarea
          id="profile-bio"
          rows={3}
          value={profileForm.bio}
          onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
          placeholder={t('profile.bioPlaceholder')}
          className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
        />
      </div>
    </>
  );
};

const buildProfilePayload = (profileForm, role) => {
  const payload = {
    name: profileForm.name.trim(),
    email: profileForm.email.trim(),
  };
  if (role && role !== 'student') {
    payload.specialty = profileForm.specialty.trim();
    payload.bio = profileForm.bio.trim();
  }
  return payload;
};

const IdentityStatusAlerts = ({ mustRotatePw, profileError, profileSuccess, onClearError, onClearSuccess, t, tServer }) => (
  <div className="mt-4 space-y-3">
    {mustRotatePw && <AlertBanner variant="info">{t('profile.detailsLockedUntilPwChange')}</AlertBanner>}
    {profileError && (
      <AlertBanner variant="error" onDismiss={onClearError}>
        {tServer(profileError)}
      </AlertBanner>
    )}
    {profileSuccess && (
      <AlertBanner variant="success" onDismiss={onClearSuccess}>
        {profileSuccess}
      </AlertBanner>
    )}
  </div>
);

const IdentityFormFields = ({ profileForm, setProfileForm, role, disabled, saving, onSubmit, t }) => (
  <form onSubmit={onSubmit} className="mt-5">
    <fieldset disabled={disabled} className="space-y-4 disabled:opacity-60">
      <div>
        <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
          {t('profile.nameLabel')}
        </label>
        <input
          id="profile-name"
          type="text"
          required
          value={profileForm.name}
          onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
          className="min-h-[44px] w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
        />
      </div>
      <div>
        <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
          {t('profile.emailLabel')}
        </label>
        <input
          id="profile-email"
          type="email"
          dir="ltr"
          required
          value={profileForm.email}
          onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
          className="min-h-[44px] w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
        />
      </div>
      <StaffProfileFields role={role} profileForm={profileForm} setProfileForm={setProfileForm} t={t} />
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
      >
        <Check size={16} weight="bold" aria-hidden="true" />
        {saving ? t('common.saving') : t('profile.saveBtn')}
      </button>
    </fieldset>
  </form>
);

export const ProfileIdentitySection = ({ currentUser, mustRotatePw, refreshUser }) => {
  const { t, tServer } = useLanguage();
  const { addToast } = useToast();
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_FORM);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    setProfileForm(toProfileFormState(currentUser));
  }, [currentUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (mustRotatePw) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await usersAPI.updateMe(buildProfilePayload(profileForm, currentUser?.role));
      await refreshUser();
      setProfileSuccess(t('profile.updated'));
      addToast(t('profile.updated'), 'success');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <section
      aria-labelledby="profile-identity-heading"
      className="overflow-hidden rounded-2xl border border-[#99F6E4] bg-white shadow-xs lg:col-span-6"
    >
      <div className="h-1.5 w-full bg-[#0D9488]" />
      <div className="p-6 sm:p-7">
        <h2 id="profile-identity-heading" className="font-display text-lg font-semibold text-[#0D2E2F]">
          {t('profile.detailsTitle')}
        </h2>
        <p className="mt-1 text-xs text-[#335C5D]">{t('profile.detailsNote')}</p>
        <IdentityStatusAlerts
          mustRotatePw={mustRotatePw}
          profileError={profileError}
          profileSuccess={profileSuccess}
          onClearError={() => setProfileError('')}
          onClearSuccess={() => setProfileSuccess('')}
          t={t}
          tServer={tServer}
        />
        <IdentityFormFields
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          role={currentUser?.role}
          disabled={mustRotatePw || profileSaving}
          saving={profileSaving}
          onSubmit={handleProfileSubmit}
          t={t}
        />
      </div>
    </section>
  );
};
