import React, { useEffect, useState } from 'react';
import { Check, Copy, EnvelopeSimple, Key, UserPlus } from '@phosphor-icons/react';
import { Modal } from '../ui/Modal';
import { AlertBanner } from '../ui/AlertBanner';
import { adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const CreateStaffModal = ({ open, onClose, callerRole, onCreated }) => {
  const { t, tServer } = useLanguage();
  const isSuperAdmin = callerRole === 'super_admin';

  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'instructor',
    specialty: '',
    bio: '',
    temporaryPassword: '',
    sendEmail: true,
  });
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm({
        name: '',
        email: '',
        role: 'instructor',
        specialty: '',
        bio: '',
        temporaryPassword: '',
        sendEmail: true,
      });
      setAutoGeneratePassword(true);
      setError('');
      setCreatedResult(null);
      setCopied(false);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        specialty: form.specialty.trim(),
        bio: form.bio.trim(),
        temporaryPassword: autoGeneratePassword ? '' : form.temporaryPassword,
        sendEmail: form.sendEmail,
      };
      const res = await adminAPI.createUser(payload);
      setCreatedResult(res);
      onCreated?.(res.data);
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdResult?.data) return;
    const text = `Email: ${createdResult.data.email}\nTemporary Password: ${createdResult.temporaryPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={createdResult ? t('admin.staffCreatedTitle') : t('admin.addStaffTitle')}
      description={createdResult ? t('admin.staffCreatedDesc') : t('admin.addStaffDesc')}
      maxWidthClass="max-w-xl"
    >
      {createdResult ? (
        <div className="space-y-4">
          <AlertBanner variant="success">
            {t('admin.staffCreatedSuccess', {
              name: createdResult.data?.name || '',
              role: t(`role.${createdResult.data?.role || 'instructor'}`),
            })}
          </AlertBanner>

          <div className="rounded-xl border border-[#99F6E4] bg-[#F0FDFA] p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#335C5D]">
              <span className="font-semibold">{t('auth.emailLabel')}</span>
              <span dir="ltr" className="font-mono-tabular font-semibold text-[#0D2E2F]">
                {createdResult.data?.email}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#335C5D]">
              <span className="font-semibold">{t('admin.tempPasswordLabel')}</span>
              <code
                dir="ltr"
                className="rounded bg-white px-2.5 py-1 font-mono-tabular text-sm font-bold text-[#0B3B3C] ring-1 ring-[#99F6E4]"
              >
                {createdResult.temporaryPassword}
              </code>
            </div>
            <p className="flex items-center gap-1.5 pt-1 text-xs text-[#0F766E]">
              <EnvelopeSimple size={14} weight="duotone" aria-hidden="true" />
              {createdResult.emailSent
                ? t('admin.welcomeEmailSent')
                : t('admin.welcomeEmailSkipped')}
            </p>
          </div>

          <AlertBanner variant="warning">{t('admin.mustRotateNotice')}</AlertBanner>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#CCFBF1] pt-4">
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-semibold text-[#0D2E2F] hover:bg-[#F0FDFA]"
            >
              {copied ? <Check size={16} className="text-[#059669]" /> : <Copy size={16} />}
              {copied ? t('admin.copied') : t('admin.copyCredentials')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]"
            >
              {t('admin.done')}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <AlertBanner variant="error">{tServer(error)}</AlertBanner>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="staff-name" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
                {t('register.nameLabel')}
              </label>
              <input
                id="staff-name"
                type="text"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={t('register.namePlaceholder')}
                className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
              />
            </div>

            <div>
              <label htmlFor="staff-role" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
                {t('profile.roleLabel')}
              </label>
              <select
                id="staff-role"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="w-full rounded-lg border border-[#99F6E4] bg-white px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
              >
                <option value="instructor">{t('role.instructor')}</option>
                <option value="student">{t('role.student')}</option>
                {isSuperAdmin && <option value="admin">{t('role.admin')}</option>}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="staff-email" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
              {t('auth.emailLabel')}
            </label>
            <input
              id="staff-email"
              type="email"
              dir="ltr"
              required
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="instructor@foundry.edu"
              className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
            />
          </div>

          <div>
            <label htmlFor="staff-specialty" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
              {t('profile.specialtyLabel')}{' '}
              <span className="font-normal text-[#52797A]">{t('modal.optional')}</span>
            </label>
            <input
              id="staff-specialty"
              type="text"
              value={form.specialty}
              onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
              placeholder={t('profile.specialtyPlaceholder')}
              className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
            />
          </div>

          <div className="rounded-xl border border-[#CCFBF1] bg-[#F0FDFA]/60 p-3.5 space-y-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-[#0D2E2F]">
              <input
                type="checkbox"
                checked={autoGeneratePassword}
                onChange={(e) => setAutoGeneratePassword(e.target.checked)}
                className="h-4 w-4 rounded border-[#5EEAD4] text-[#0D9488] focus:ring-[#0D9488]"
              />
              <Key size={16} weight="duotone" className="text-[#D97706]" aria-hidden="true" />
              {t('admin.autoGenPassword')}
            </label>

            {!autoGeneratePassword && (
              <div>
                <label htmlFor="staff-temp-pw" className="mb-1 block text-xs font-medium text-[#335C5D]">
                  {t('admin.manualTempPwLabel')}
                </label>
                <input
                  id="staff-temp-pw"
                  type="text"
                  dir="ltr"
                  required={!autoGeneratePassword}
                  value={form.temporaryPassword}
                  onChange={(e) => setForm((p) => ({ ...p, temporaryPassword: e.target.value }))}
                  placeholder="TempPass123!"
                  className="w-full rounded-lg border border-[#99F6E4] bg-white px-3 py-2 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
                />
                <p className="mt-1 text-[11px] text-[#52797A]">{t('admin.pwPolicyHint')}</p>
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-[#335C5D]">
              <input
                type="checkbox"
                checked={form.sendEmail}
                onChange={(e) => setForm((p) => ({ ...p, sendEmail: e.target.checked }))}
                className="h-4 w-4 rounded border-[#5EEAD4] text-[#0D9488] focus:ring-[#0D9488]"
              />
              {t('admin.sendWelcomeEmail')}
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#CCFBF1] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-medium text-[#0D2E2F] hover:bg-[#F0FDFA]"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:opacity-60"
            >
              <UserPlus size={16} weight="bold" aria-hidden="true" />
              {submitting ? t('common.saving') : t('admin.createStaffBtn')}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
