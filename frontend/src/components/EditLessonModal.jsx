import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { AlertBanner } from './ui/AlertBanner';
import { lessonsAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const EditLessonModal = ({ show, onHide, lessonData, onUpdate }) => {
  const { t, tServer } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && lessonData) {
      setFormData({
        title: lessonData.title || '',
        description: lessonData.description || '',
        content: lessonData.content || '',
        videoUrl: lessonData.videoUrl || '',
      });
      setError('');
    }
  }, [show, lessonData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const lId = lessonData._id || lessonData.id;
      const res = await lessonsAPI.update(lId, formData);
      onUpdate(res.lesson || res.data || res);
      onHide();
    } catch (err) {
      setError(err.message || 'Failed to update lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={show} onClose={onHide} title={t('modal.editLessonTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBanner variant="error">{tServer(error)}</AlertBanner>}

        <div>
          <label htmlFor="edit-lesson-title" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.lessonTitleLabel')}
          </label>
          <input
            id="edit-lesson-title"
            type="text"
            dir="auto"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="min-h-[44px] w-full rounded-lg border border-[#99F6E4] px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
        </div>

        <div>
          <label htmlFor="edit-lesson-desc" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.lessonDescLabel')}
          </label>
          <input
            id="edit-lesson-desc"
            type="text"
            dir="auto"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="min-h-[44px] w-full rounded-lg border border-[#99F6E4] px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
        </div>

        <div>
          <label htmlFor="edit-lesson-content" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.lessonNotesLabel')}
          </label>
          <textarea
            id="edit-lesson-content"
            rows={4}
            dir="auto"
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
        </div>

        <div>
          <label htmlFor="edit-lesson-video" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.lessonVideoLabel')}{' '}
            <span className="font-normal text-[#4A6F70]">{t('modal.optional')}</span>
          </label>
          <input
            id="edit-lesson-video"
            type="url"
            dir="ltr"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="min-h-[44px] w-full rounded-lg border border-[#99F6E4] px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
        </div>

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
            {loading ? t('common.saving') : t('modal.saveLesson')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
