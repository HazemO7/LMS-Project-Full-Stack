import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookBookmark, Plus } from '@phosphor-icons/react';
import { coursesAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { AlertBanner } from '../components/ui/AlertBanner';

export const CreateCourse = () => {
  const { t, tServer } = useLanguage();
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
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F766E] hover:text-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
      >
        <ArrowLeft size={15} aria-hidden="true" className="rtl:rotate-180" />
        {t('createCourse.back')}
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#99F6E4] bg-white shadow-xs">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0D9488] to-[#F59E0B]" />
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-3.5 border-b border-[#CCFBF1] pb-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#CCFBF1] text-[#0D9488]">
              <BookBookmark size={22} weight="duotone" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#0D2E2F]">
                {t('createCourse.title')}
              </h1>
              <p className="mt-1 text-sm text-[#335C5D]">{t('createCourse.subtitle')}</p>
            </div>
          </div>

          {error && (
            <AlertBanner variant="error" className="mt-6" onDismiss={() => setError('')}>
              {tServer(error)}
            </AlertBanner>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="course-title"
                className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
              >
                {t('createCourse.nameLabel')}
              </label>
              <input
                id="course-title"
                type="text"
                name="title"
                required
                value={courseData.title}
                onChange={handleChange}
                placeholder={t('createCourse.namePlaceholder')}
                className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-sm text-[#0D2E2F] placeholder:text-[#52797A]/70 focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
              />
            </div>

            <div>
              <label
                htmlFor="course-description"
                className="mb-1.5 block text-sm font-medium text-[#0D2E2F]"
              >
                {t('createCourse.descLabel')}
              </label>
              <textarea
                id="course-description"
                name="description"
                rows={5}
                required
                value={courseData.description}
                onChange={handleChange}
                placeholder={t('createCourse.descPlaceholder')}
                className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/40 px-3.5 py-2.5 text-sm text-[#0D2E2F] placeholder:text-[#52797A]/70 focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#CCFBF1] pt-5">
              <Link
                to="/courses"
                className="rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-4 py-2.5 text-sm font-medium text-[#0D2E2F] hover:bg-[#CCFBF1]"
              >
                {t('common.cancel')}
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0D9488] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0F766E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
              >
                <Plus size={16} weight="bold" aria-hidden="true" />
                {loading ? t('createCourse.submitting') : t('createCourse.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
