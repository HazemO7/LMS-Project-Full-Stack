import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { AlertBanner } from './ui/AlertBanner';
import { modulesAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const buildModuleForm = (moduleData) => ({
  title: moduleData?.title || '',
  description: moduleData?.description || '',
});

const extractUpdatedModule = (res) => res.module || res.data || res;

const EditModuleFormFields = ({ formData, onChange, t }) => (
  <>
    <div>
      <label htmlFor="edit-module-title" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
        {t('modal.moduleTitleLabel')}
      </label>
      <input
        id="edit-module-title"
        type="text"
        dir="auto"
        required
        value={formData.title}
        onChange={(e) => onChange('title', e.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-[#99F6E4] px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
      />
    </div>

    <div>
      <label htmlFor="edit-module-desc" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
        {t('modal.moduleObjectiveLabel')}
      </label>
      <textarea
        id="edit-module-desc"
        rows={3}
        dir="auto"
        required
        value={formData.description}
        onChange={(e) => onChange('description', e.target.value)}
        className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
      />
    </div>
  </>
);

const ModalFormFooter = ({ onHide, loading, submitLabel, t }) => (
  <div className="flex justify-end gap-3 border-t border-[#CCFBF1] pt-4">
    <button
      type="button"
      onClick={onHide}
      disabled={loading}
      className="inline-flex min-h-[44px] items-center rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-medium text-[#0D2E2F] hover:bg-[#F0FDFA]"
    >
      {t('common.cancel')}
    </button>
    <button
      type="submit"
      disabled={loading}
      className="inline-flex min-h-[44px] items-center rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115E59] disabled:opacity-60"
    >
      {loading ? t('common.saving') : submitLabel}
    </button>
  </div>
);

export const EditModuleModal = ({ show, onHide, moduleData, onUpdate }) => {
  const { t, tServer } = useLanguage();
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !moduleData) return;
    setFormData(buildModuleForm(moduleData));
    setError('');
  }, [show, moduleData]);

  const handleFieldChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const mId = moduleData._id || moduleData.id;
      const res = await modulesAPI.update(mId, formData);
      onUpdate(extractUpdatedModule(res));
      onHide();
    } catch (err) {
      setError(err.message || 'Failed to update module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={show} onClose={onHide} title={t('modal.editModuleTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBanner variant="error">{tServer(error)}</AlertBanner>}
        <EditModuleFormFields formData={formData} onChange={handleFieldChange} t={t} />
        <ModalFormFooter onHide={onHide} loading={loading} submitLabel={t('modal.saveModule')} t={t} />
      </form>
    </Modal>
  );
};
