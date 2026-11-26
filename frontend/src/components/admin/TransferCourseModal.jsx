import React, { useEffect, useState } from 'react';
import { ArrowsLeftRight } from '@phosphor-icons/react';
import { Modal } from '../ui/Modal';
import { AlertBanner } from '../ui/AlertBanner';
import { adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const TransferCourseModal = ({
  open,
  onClose,
  course,
  instructors = [],
  staffLoading = false,
  staffError = '',
  onRetryStaff,
  onTransferred,
}) => {
  const { t, tServer } = useLanguage();
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentOwnerId = course?.instructor?._id || course?.instructor || '';

  useEffect(() => {
    if (open && course) {
      setSelectedId('');
      setError('');
    }
  }, [open, course]);

  const requestClose = () => {
    if (!saving) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!course || !selectedId) return;
    if (selectedId === currentOwnerId) {
      setError(t('admin.sameOwnerError'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await adminAPI.transferCourse(course._id, selectedId);
      onTransferred?.(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to transfer course ownership');
    } finally {
      setSaving(false);
    }
  };

  const eligibleTransferTargets = instructors.filter((inst) => inst._id !== currentOwnerId);

  return (
    <Modal
      open={open}
      onClose={requestClose}
      title={t('admin.transferCourseTitle')}
      description={course ? course.title : ''}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBanner variant="error">{tServer(error)}</AlertBanner>}

        {staffError && (
          <AlertBanner variant="error">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{tServer(staffError)}</span>
              {onRetryStaff && (
                <button
                  type="button"
                  onClick={onRetryStaff}
                  disabled={staffLoading}
                  className="rounded-md border border-[#FECACA] bg-white px-2.5 py-1 text-xs font-semibold text-[#991B1B] hover:bg-[#FEF2F2] disabled:opacity-50"
                >
                  {t('common.retry')}
                </button>
              )}
            </div>
          </AlertBanner>
        )}

        <div>
          <label
            htmlFor="transfer-instructor-select"
            className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
          >
            {t('admin.selectNewOwner')}
          </label>
          <select
            id="transfer-instructor-select"
            required
            disabled={saving || staffLoading || Boolean(staffError)}
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setError('');
            }}
            className="w-full rounded-lg border border-[#99F6E4] bg-white px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 disabled:opacity-60"
          >
            <option value="">{t('admin.chooseOwnerPlaceholder')}</option>
            {instructors.map((inst) => {
              const isCurrent = inst._id === currentOwnerId;
              return (
                <option key={inst._id} value={inst._id} disabled={isCurrent}>
                  {inst.name} ({inst.email}) — {t(`role.${inst.role}`)}
                  {isCurrent ? ` (${t('admin.currentOwnerTag')})` : ''}
                </option>
              );
            })}
          </select>
          {staffLoading && (
            <p className="mt-1.5 text-xs text-[#52797A]">{t('common.loading')}</p>
          )}
          {!staffLoading && !staffError && eligibleTransferTargets.length === 0 && (
            <p className="mt-1.5 text-xs text-[#52797A]">{t('admin.noOtherOwners')}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#CCFBF1] pt-4">
          <button
            type="button"
            onClick={requestClose}
            disabled={saving}
            className="rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-medium text-[#0D2E2F] hover:bg-[#F0FDFA]"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={
              saving ||
              staffLoading ||
              Boolean(staffError) ||
              !selectedId ||
              selectedId === currentOwnerId
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:opacity-60"
          >
            <ArrowsLeftRight size={16} aria-hidden="true" />
            {saving ? t('common.saving') : t('admin.confirmTransfer')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
