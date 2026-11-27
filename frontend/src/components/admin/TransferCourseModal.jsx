import React, { useCallback, useState } from 'react';
import { ArrowsLeftRight } from '@phosphor-icons/react';
import { Modal } from '../ui/Modal';
import { AlertBanner } from '../ui/AlertBanner';
import { adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const isTransferBlocked = ({ saving, staffLoading, staffError }) =>
  saving || staffLoading || Boolean(staffError);

const isTransferSubmitDisabled = (state) => {
  if (isTransferBlocked(state)) return true;
  return !state.selectedId || state.selectedId === state.currentOwnerId;
};

const StaffErrorBanner = ({ staffError, staffLoading, onRetryStaff, t, tServer }) => {
  if (!staffError) return null;
  return (
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
  );
};

const OwnerSelectField = ({
  instructors,
  currentOwnerId,
  selectedId,
  disabled,
  staffLoading,
  staffError,
  onSelect,
  t,
}) => {
  const eligibleTargets = instructors.filter((inst) => inst._id !== currentOwnerId);
  const showEmptyNotice = !staffLoading && !staffError && eligibleTargets.length === 0;
  return (
    <div>
      <label htmlFor="transfer-instructor-select" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
        {t('admin.selectNewOwner')}
      </label>
      <select
        id="transfer-instructor-select"
        required
        disabled={disabled}
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-lg border border-[#99F6E4] bg-white px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 disabled:opacity-60"
      >
        <option value="">{t('admin.chooseOwnerPlaceholder')}</option>
        {instructors.map((inst) => {
          const isCurrent = inst._id === currentOwnerId;
          const suffix = isCurrent ? ` (${t('admin.currentOwnerTag')})` : '';
          return (
            <option key={inst._id} value={inst._id} disabled={isCurrent}>
              {inst.name} ({inst.email}) — {t(`role.${inst.role}`)}{suffix}
            </option>
          );
        })}
      </select>
      {staffLoading && <p className="mt-1.5 text-xs text-[#52797A]">{t('common.loading')}</p>}
      {showEmptyNotice && <p className="mt-1.5 text-xs text-[#52797A]">{t('admin.noOtherOwners')}</p>}
    </div>
  );
};

const TransferModalActions = ({ saving, submitDisabled, onCancel, t }) => (
  <div className="flex justify-end gap-3 border-t border-[#CCFBF1] pt-4">
    <button
      type="button"
      onClick={onCancel}
      disabled={saving}
      className="rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-medium text-[#0D2E2F] hover:bg-[#F0FDFA]"
    >
      {t('common.cancel')}
    </button>
    <button
      type="submit"
      disabled={submitDisabled}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:opacity-60"
    >
      <ArrowsLeftRight size={16} aria-hidden="true" />
      {saving ? t('common.saving') : t('admin.confirmTransfer')}
    </button>
  </div>
);

const getCurrentOwnerId = (course) => {
  if (!course?.instructor) return '';
  return course.instructor._id || course.instructor;
};

const getTransferValidationError = ({ course, selectedId, currentOwnerId, t }) => {
  if (!course || !selectedId) return 'SKIP';
  if (selectedId === currentOwnerId) return t('admin.sameOwnerError');
  return '';
};

const executeCourseTransfer = async ({ courseId, selectedId, onTransferred, onClose, setError, setSaving }) => {
  setSaving(true);
  setError('');
  try {
    const res = await adminAPI.transferCourse(courseId, selectedId);
    onTransferred?.(res.data);
    onClose();
  } catch (err) {
    setError(err.message || 'Failed to transfer course ownership');
  } finally {
    setSaving(false);
  }
};

const useTransferFormState = ({ course, onClose, onTransferred, setSaving, t }) => {
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');
  const currentOwnerId = getCurrentOwnerId(course);

  const handleSelect = (val) => {
    setSelectedId(val);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErr = getTransferValidationError({ course, selectedId, currentOwnerId, t });
    if (validationErr === 'SKIP') return;
    if (validationErr) {
      setError(validationErr);
      return;
    }
    return executeCourseTransfer({ courseId: course._id, selectedId, onTransferred, onClose, setError, setSaving });
  };

  return { selectedId, error, currentOwnerId, handleSelect, handleSubmit };
};

const TransferCourseBody = ({
  course,
  instructors,
  staffLoading,
  staffError,
  onRetryStaff,
  onTransferred,
  saving,
  setSaving,
  onClose,
  onCancel,
  t,
  tServer,
}) => {
  const state = useTransferFormState({ course, onClose, onTransferred, setSaving, t });
  const submitDisabled = isTransferSubmitDisabled({
    saving,
    staffLoading,
    staffError,
    selectedId: state.selectedId,
    currentOwnerId: state.currentOwnerId,
  });

  return (
    <form onSubmit={state.handleSubmit} className="space-y-4">
      {state.error && <AlertBanner variant="error">{tServer(state.error)}</AlertBanner>}
      <StaffErrorBanner
        staffError={staffError}
        staffLoading={staffLoading}
        onRetryStaff={onRetryStaff}
        t={t}
        tServer={tServer}
      />
      <OwnerSelectField
        instructors={instructors}
        currentOwnerId={state.currentOwnerId}
        selectedId={state.selectedId}
        disabled={isTransferBlocked({ saving, staffLoading, staffError })}
        staffLoading={staffLoading}
        staffError={staffError}
        onSelect={state.handleSelect}
        t={t}
      />
      <TransferModalActions saving={saving} submitDisabled={submitDisabled} onCancel={onCancel} t={t} />
    </form>
  );
};

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
  const [saving, setSaving] = useState(false);
  const requestClose = useCallback(() => {
    if (!saving) onClose();
  }, [saving, onClose]);

  return (
    <Modal
      open={open}
      onClose={requestClose}
      title={t('admin.transferCourseTitle')}
      description={course ? course.title : ''}
      maxWidthClass="max-w-md"
    >
      {open && (
        <TransferCourseBody
          key={course?._id || 'none'}
          course={course}
          instructors={instructors}
          staffLoading={staffLoading}
          staffError={staffError}
          onRetryStaff={onRetryStaff}
          onTransferred={onTransferred}
          saving={saving}
          setSaving={setSaving}
          onClose={onClose}
          onCancel={requestClose}
          t={t}
          tServer={tServer}
        />
      )}
    </Modal>
  );
};
