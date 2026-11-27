import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { AlertBanner } from './ui/AlertBanner';
import { lessonsAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const CreateLessonModal = ({
  show,
  onHide,
  moduleId,
  onLessonCreated,
}) => {
  const { t, tServer } = useLanguage();
  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) {
      setLessonData({ title: '', description: '', content: '', videoUrl: '' });
      setError('');
    }
  }, [show]);

  const handleChange = (e) => {
    setLessonData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...lessonData, module: moduleId };
      const newLessonRes = await lessonsAPI.create(payload);
      const newLesson = newLessonRes.data || newLessonRes;

      onLessonCreated(newLesson, moduleId);
      onHide();
      setLessonData({ title: '', description: '', content: '', videoUrl: '' });
    } catch (err) {
      setError(err.message || 'Failed to create lesson');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={show}
      onClose={onHide}
      title={t('modal.addLessonTitle')}
      description={t('modal.addLessonDesc')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBanner variant="error">{tServer(error)}</AlertBanner>}

        <div>
          <label htmlFor="create-lesson-title" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.lessonTitleLabel')}
          </label>
          <input
            id="create-lesson-title"
            type="text"
            name="title"
            required
            value={lessonData.title}
            onChange={handleChange}
            placeholder={t('modal.lessonTitlePh')}
            className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
        </div>

        <div>
          <label htmlFor="create-lesson-desc" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.lessonDescLabel')}
          </label>
          <input
            id="create-lesson-desc"
            type="text"
            name="description"
            required
            value={lessonData.description}
            onChange={handleChange}
            placeholder={t('modal.lessonDescPh')}
            className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
        </div>

        <div>
          <label htmlFor="create-lesson-content" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.lessonNotesLabel')}
          </label>
          <textarea
            id="create-lesson-content"
            name="content"
            rows={4}
            required
            value={lessonData.content}
            onChange={handleChange}
            placeholder={t('modal.lessonNotesPh')}
            className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
        </div>

        <div>
          <label htmlFor="create-lesson-video" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.lessonVideoLabel')}{' '}
            <span className="font-normal text-[#52797A]">{t('modal.optional')}</span>
          </label>
          <input
            id="create-lesson-video"
            type="url"
            dir="ltr"
            name="videoUrl"
            value={lessonData.videoUrl}
            onChange={handleChange}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
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
            {loading ? t('common.saving') : t('modal.saveLesson')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
