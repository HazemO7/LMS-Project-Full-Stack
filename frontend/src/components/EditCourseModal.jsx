import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { AlertBanner } from './ui/AlertBanner';
import { coursesAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const buildCourseForm = (course) => ({
  title: course?.title || '',
  description: course?.description || '',
});

const extractUpdatedCourse = (result) => result.data || result.course || result;

const EditCourseFormFields = ({ formData, onChange, t }) => (
  <>
    <div>
      <label htmlFor="edit-course-title" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
        {t('modal.courseTitleLabel')}
      </label>
      <input
        id="edit-course-title"
        type="text"
        dir="auto"
        required
        value={formData.title}
        onChange={(e) => onChange('title', e.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-[#99F6E4] px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
      />
    </div>

    <div>
      <label htmlFor="edit-course-desc" className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
        {t('modal.courseDescLabel')}
      </label>
      <textarea
        id="edit-course-desc"
        rows={4}
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

export const EditCourseModal = ({ show, onHide, course, onUpdate }) => {
  const { t, tServer } = useLanguage();
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !course) return;
    setFormData(buildCourseForm(course));
    setError('');
  }, [show, course]);

  const handleFieldChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const courseId = course._id || course.id;
      const result = await coursesAPI.update(courseId, formData);
      onUpdate(extractUpdatedCourse(result));
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
        <EditCourseFormFields formData={formData} onChange={handleFieldChange} t={t} />
        <ModalFormFooter onHide={onHide} loading={loading} submitLabel={t('modal.saveChanges')} t={t} />
      </form>
    </Modal>
  );
};
