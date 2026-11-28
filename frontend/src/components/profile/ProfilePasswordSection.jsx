import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Key } from '@phosphor-icons/react';
import { authAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getPasswordRules } from '../../utils/passwordRules';
import { AlertBanner } from '../ui/AlertBanner';
import { FormErrorSummary } from '../ui/FormErrorSummary';
import { PasswordInput } from '../ui/PasswordInput';
import { PasswordStrengthMeter } from '../ui/PasswordStrengthMeter';

const PASSWORD_FIELD_MAP = {
  currentPassword: 'current-password',
  newPassword: 'new-password',
  confirmPassword: 'confirm-new-password',
};

const PasswordStatusAlerts = ({ passwordError, passwordSuccess, errors, submitCount, onDismissError, tServer }) => (
  <div className="mt-4 space-y-3">
    {passwordError && (
      <AlertBanner variant="error" onDismiss={onDismissError}>
        {tServer(passwordError)}
      </AlertBanner>
    )}
    {passwordSuccess && <AlertBanner variant="success">{passwordSuccess}</AlertBanner>}
    <FormErrorSummary errors={errors} submitCount={submitCount} fieldMap={PASSWORD_FIELD_MAP} />
  </div>
);

const PasswordFieldsForm = ({ onSubmit, register, errors, passwordSaving, watchedNewPassword, t }) => (
  <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
    <PasswordInput
      id="current-password"
      label={t('profile.currentPw')}
      autoComplete="current-password"
      disabled={passwordSaving}
      error={errors.currentPassword}
      registration={register('currentPassword', { required: t('profile.currentPwRequired') })}
      showLabel={t('auth.showPassword')}
      hideLabel={t('auth.hidePassword')}
    />

    <div className="space-y-3">
      <PasswordInput
        id="new-password"
        label={t('profile.newPw')}
        autoComplete="new-password"
        disabled={passwordSaving}
        error={errors.newPassword}
        registration={register('newPassword', getPasswordRules(t))}
        showLabel={t('auth.showPassword')}
        hideLabel={t('auth.hidePassword')}
      />
      <PasswordStrengthMeter password={watchedNewPassword} />
    </div>

    <PasswordInput
      id="confirm-new-password"
      label={t('profile.confirmPw')}
      autoComplete="new-password"
      disabled={passwordSaving}
      error={errors.confirmPassword}
      registration={register('confirmPassword', {
        required: t('reset.confirmRequired'),
        validate: (v) => v === watchedNewPassword || t('reset.mismatch'),
      })}
      showLabel={t('auth.showPassword')}
      hideLabel={t('auth.hidePassword')}
    />

    <button
      type="submit"
      disabled={passwordSaving}
      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#0B3B3C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#114B4D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
    >
      <Key size={16} weight="bold" aria-hidden="true" className="text-[#F59E0B]" />
      {passwordSaving ? t('profile.updatingPw') : t('profile.updatePwBtn')}
    </button>
  </form>
);

export const ProfilePasswordSection = ({ logoutUser, mustRotatePw = false }) => {
  const { t, tServer } = useLanguage();
  const navigate = useNavigate();
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset: resetPasswordForm,
    formState: { errors, submitCount },
  } = useForm({ shouldFocusError: false });

  const handlePasswordSubmit = async (data) => {
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await authAPI.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setPasswordSuccess(t('profile.pwUpdatedMsg'));
      resetPasswordForm();
      setTimeout(() => {
        logoutUser();
        navigate('/login', { replace: true, state: { passwordChanged: true } });
      }, 1500);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <section
      aria-labelledby="profile-password-heading"
      className={`overflow-hidden rounded-2xl border border-[#99F6E4] border-t-4 border-t-[#D97706] bg-white shadow-xs lg:col-span-6 ${
        mustRotatePw ? 'order-first lg:order-none' : ''
      }`}
    >
      <div className="p-6 sm:p-7">
        <h2 id="profile-password-heading" className="font-display text-lg font-semibold text-[#0D2E2F]">
          {t('profile.securityTitle')}
        </h2>
        <p className="mt-1 text-xs text-[#335C5D]">{t('profile.securityNote')}</p>
        <PasswordStatusAlerts
          passwordError={passwordError}
          passwordSuccess={passwordSuccess}
          errors={errors}
          submitCount={submitCount}
          onDismissError={() => setPasswordError('')}
          tServer={tServer}
        />
        <PasswordFieldsForm
          onSubmit={handleSubmit(handlePasswordSubmit)}
          register={register}
          errors={errors}
          passwordSaving={passwordSaving}
          watchedNewPassword={watch('newPassword', '')}
          t={t}
        />
      </div>
    </section>
  );
};
