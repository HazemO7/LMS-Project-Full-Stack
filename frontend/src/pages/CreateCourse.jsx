import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookBookmark, Plus } from '@phosphor-icons/react';
import { coursesAPI } from '../services/api';
import { AlertBanner } from '../components/ui/AlertBanner';

export const CreateCourse = () => {
  const [courseData, setCourseData] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCourseData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await coursesAPI.create({
        title: courseData.title.trim(),
        description: courseData.description.trim(),
      });
      const newCourseId = response.data?._id || response._id;
      navigate(newCourseId ? `/course/${newCourseId}` : '/courses');
    } catch (err) {
      setError(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-12 lg:px-8">
      <Link
        to="/courses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#475569] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to courses
      </Link>

      <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8">
        <div className="flex items-start gap-3.5 border-b border-[#E2E8F0] pb-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1D4ED8]">
            <BookBookmark size={22} weight="duotone" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A]">
              Create a new course
            </h1>
            <p className="mt-1 text-sm text-[#475569]">
              Start with the course title and syllabus overview. You can add modules and video lessons right after publishing.
            </p>
          </div>
        </div>

        {error && (
          <AlertBanner variant="error" className="mt-6" onDismiss={() => setError('')}>
            {error}
          </AlertBanner>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="course-title"
              className="mb-1.5 block text-sm font-medium text-[#0F172A]"
            >
              Course title
            </label>
            <input
              id="course-title"
              type="text"
              name="title"
              required
              value={courseData.title}
              onChange={handleChange}
              placeholder="e.g. Distributed Systems in Practice"
              className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
            />
          </div>

          <div>
            <label
              htmlFor="course-description"
              className="mb-1.5 block text-sm font-medium text-[#0F172A]"
            >
              Course overview
            </label>
            <textarea
              id="course-description"
              name="description"
              rows={5}
              required
              value={courseData.description}
              onChange={handleChange}
              placeholder="Summarize what students will build, prerequisites, and the core topics covered..."
              className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#E2E8F0] pt-5">
            <Link
              to="/courses"
              className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-[#F7F8FA]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1D4ED8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 disabled:opacity-60"
            >
              <Plus size={16} weight="bold" aria-hidden="true" />
              {loading ? 'Publishing...' : 'Publish course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
