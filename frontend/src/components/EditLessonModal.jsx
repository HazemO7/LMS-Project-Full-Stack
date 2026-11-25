import React, { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { AlertBanner } from './ui/AlertBanner';
import { lessonsAPI } from '../services/api';

export const EditLessonModal = ({ show, onHide, lessonData, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lessonData) {
      setFormData({
        title: lessonData.title || '',
        description: lessonData.description || '',
        content: lessonData.content || '',
        videoUrl: lessonData.videoUrl || '',
      });
      setError('');
    }
  }, [lessonData]);

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
    <Modal open={show} onClose={onHide} title="Edit lesson">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBanner variant="error">{error}</AlertBanner>}

        <div>
          <label htmlFor="edit-lesson-title" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            Lesson title
          </label>
          <input
            id="edit-lesson-title"
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div>
          <label htmlFor="edit-lesson-desc" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            Short description
          </label>
          <input
            id="edit-lesson-desc"
            type="text"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div>
          <label htmlFor="edit-lesson-content" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            Lesson notes
          </label>
          <textarea
            id="edit-lesson-content"
            rows={4}
            required
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div>
          <label htmlFor="edit-lesson-video" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            YouTube video URL <span className="font-normal text-[#64748B]">(optional)</span>
          </label>
          <input
            id="edit-lesson-video"
            type="url"
            value={formData.videoUrl}
            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
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
            {loading ? 'Saving...' : 'Save lesson'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
