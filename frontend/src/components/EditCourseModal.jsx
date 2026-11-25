import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { AlertBanner } from './ui/AlertBanner';
import { coursesAPI } from '../services/api';

export const EditCourseModal = ({ show, onHide, course, onUpdate }) => {
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
    <Modal open={show} onClose={onHide} title="Edit course details">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBanner variant="error">{error}</AlertBanner>}

        <div>
          <label htmlFor="edit-course-title" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            Course title
          </label>
          <input
            id="edit-course-title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div>
          <label htmlFor="edit-course-desc" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            Description
          </label>
          <textarea
            id="edit-course-desc"
            rows={4}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-4">
          <button
            type="button"
            onClick={onHide}
            disabled={loading}
            className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F7F8FA]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
