import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { AlertBanner } from './ui/AlertBanner';
import { coursesAPI, modulesAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const CreateModuleModal = ({
  show,
  onHide,
  courseId,
  existingModules = [],
  onModuleCreated,
}) => {
  const { t, tServer } = useLanguage();
  const [moduleData, setModuleData] = useState({ title: '', description: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) {
      setModuleData({ title: '', description: '', content: '' });
      setError('');
    }
  }, [show]);

  const handleChange = (e) => {
    setModuleData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const newModuleRes = await modulesAPI.create(moduleData);
      const newModule = newModuleRes.data || newModuleRes;
      const moduleId = newModule._id || newModule.id || newModule;

      const updatedModules = existingModules.map((m) => m._id || m.id || m);
      if (moduleId) updatedModules.push(moduleId);

      await coursesAPI.update(courseId, { modules: updatedModules });

      onModuleCreated(newModule);
      onHide();
      setModuleData({ title: '', description: '', content: '' });
    } catch (err) {
      setError(err.message || 'Failed to create module');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={show}
      onClose={onHide}
      title={t('modal.addModuleTitle')}
      description={t('modal.addModuleDesc')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBanner variant="error">{tServer(error)}</AlertBanner>}

        <div>
          <label htmlFor="create-module-title" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.moduleTitleLabel')}
          </label>
          <input
            id="create-module-title"
            type="text"
            name="title"
            required
            value={moduleData.title}
            onChange={handleChange}
            placeholder={t('modal.moduleTitlePh')}
            className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
        </div>

        <div>
          <label htmlFor="create-module-desc" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.moduleSummaryLabel')}
          </label>
          <input
            id="create-module-desc"
            type="text"
            name="description"
            required
            value={moduleData.description}
            onChange={handleChange}
            placeholder={t('modal.moduleSummaryPh')}
            className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
        </div>

        <div>
          <label htmlFor="create-module-content" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.moduleOverviewLabel')}
          </label>
          <textarea
            id="create-module-content"
            name="content"
            rows={3}
            required
            value={moduleData.content}
            onChange={handleChange}
            placeholder={t('modal.moduleOverviewPh')}
            className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-[#CCFBF1] pt-4">
          <button
            type="button"
            onClick={onHide}
            disabled={loading}
            className="rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-medium text-[#0D2E2F] hover:bg-[#F0FDFA]"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:opacity-60"
          >
            {loading ? t('common.saving') : t('modal.saveModule')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
