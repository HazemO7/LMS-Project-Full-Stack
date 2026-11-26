import React, { useEffect, useState } from 'react';
import { ArrowsLeftRight } from '@phosphor-icons/react';
import { Modal } from '../ui/Modal';
import { AlertBanner } from '../ui/AlertBanner';
import { adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const TransferCourseModal = ({ open, onClose, course, instructors = [], onTransferred }) => {
  const { t, tServer } = useLanguage();
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && course) {
      setSelectedId(course.instructor?._id || course.instructor || '');
      setError('');
    }
  }, [open, course]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!course || !selectedId) return;
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('admin.transferCourseTitle')}
      description={course ? course.title : ''}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBanner variant="error">{tServer(error)}</AlertBanner>}

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
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-[#99F6E4] bg-white px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          >
            <option value="">{t('admin.chooseOwnerPlaceholder')}</option>
            {instructors.map((inst) => (
              <option key={inst._id} value={inst._id}>
                {inst.name} ({inst.email}) — {t(`role.${inst.role}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#CCFBF1] pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-medium text-[#0D2E2F] hover:bg-[#F0FDFA]"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving || !selectedId}
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
