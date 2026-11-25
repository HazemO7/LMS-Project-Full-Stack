import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { AlertBanner } from './ui/AlertBanner';
import { lessonsAPI, modulesAPI } from '../services/api';

export const CreateLessonModal = ({
  show,
  onHide,
  moduleId,
  existingLessons = [],
  onLessonCreated,
}) => {
  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const lessonId = newLesson._id || newLesson.id || newLesson;

      const updatedLessons = existingLessons
        ? existingLessons.map((l) => l._id || l.id || l)
        : [];
      if (lessonId) updatedLessons.push(lessonId);

      await modulesAPI.update(moduleId, { lesson: updatedLessons });

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
      title="Add lesson"
      description="Create a reading lesson with an optional YouTube video lecture."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertBanner variant="error">{error}</AlertBanner>}

        <div>
          <label htmlFor="create-lesson-title" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            Lesson title
          </label>
          <input
            id="create-lesson-title"
            type="text"
            name="title"
            required
            value={lessonData.title}
            onChange={handleChange}
            placeholder="e.g. Introduction to HTTP Routing"
            className="w-full rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div>
          <label htmlFor="create-lesson-desc" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            Short description
          </label>
          <input
            id="create-lesson-desc"
            type="text"
            name="description"
            required
            value={lessonData.description}
            onChange={handleChange}
            placeholder="One-line summary of what this lesson covers"
            className="w-full rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div>
          <label htmlFor="create-lesson-content" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            Lesson notes
          </label>
          <textarea
            id="create-lesson-content"
            name="content"
            rows={4}
            required
            value={lessonData.content}
            onChange={handleChange}
            placeholder="Write the lesson reading material or transcript..."
            className="w-full rounded-lg border border-[#CBD5E1] px-3.5 py-2 text-sm text-[#0F172A] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
          />
        </div>

        <div>
          <label htmlFor="create-lesson-video" className="mb-1.5 block text-sm font-medium text-[#0F172A]">
            YouTube video URL <span className="font-normal text-[#64748B]">(optional)</span>
          </label>
          <input
            id="create-lesson-video"
            type="url"
            name="videoUrl"
            value={lessonData.videoUrl}
            onChange={handleChange}
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
