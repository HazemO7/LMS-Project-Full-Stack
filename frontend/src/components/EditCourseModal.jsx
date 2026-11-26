import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { AlertBanner } from './ui/AlertBanner';
import { coursesAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export const EditCourseModal = ({ show, onHide, course, onUpdate }) => {
  const { t, tServer } = useLanguage();
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
      });
      setError('');
    }
  }, [course]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const courseId = course._id || course.id;
      const result = await coursesAPI.update(courseId, formData);
      onUpdate(result.data || result.course || result);
      onHide();
    } catch (err) {
      setError(err.message || 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={show} onClose={onHide} title={t('modal.editCourseTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBanner variant="error">{tServer(error)}</AlertBanner>}

        <div>
          <label htmlFor="edit-course-title" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.courseTitleLabel')}
          </label>
          <input
            id="edit-course-title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border border-[#99F6E4] px-3.5 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
        </div>

        <div>
          <label htmlFor="edit-course-desc" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
            {t('modal.courseDescLabel')}
          </label>
          <textarea
            id="edit-course-desc"
            rows={4}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            {loading ? t('common.saving') : t('modal.saveChanges')}
          </button>
        </div>
      </form>
    </Modal>
  );
};
