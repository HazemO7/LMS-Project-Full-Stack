import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, BookBookmark, Plus } from '@phosphor-icons/react';
import { coursesAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { AlertBanner } from '../components/ui/AlertBanner';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { FormErrorSummary } from '../components/ui/FormErrorSummary';

const getCourseInputClass = (hasError, extraClass = '') => {
  const stateClass = hasError
    ? 'border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-[#DC2626]/20'
    : 'border-[#99F6E4] bg-[#F0FDFA]/40 focus:border-[#0D9488] focus:bg-white focus:ring-[#0D9488]/20';
  return `w-full rounded-lg border px-3.5 py-2.5 text-start text-sm text-[#0D2E2F] placeholder:text-[#4A6F70]/75 focus:outline-none focus:ring-2 ${extraClass} ${stateClass}`;
};

const CreateCourseTopBar = ({ t }) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <Breadcrumb
      ariaLabel={t('nav.breadcrumbAria')}
      items={[
        { label: t('nav.home'), to: '/' },
        { label: t('nav.courses'), to: '/courses' },
        { label: t('createCourse.title') },
      ]}
    />
    <Link
      to="/courses"
      className="inline-flex items-center gap-1.5 py-1.5 text-xs font-medium text-[#0F766E] hover:text-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
    >
      <ArrowLeft size={14} aria-hidden="true" className="rtl:rotate-180" />
      {t('createCourse.back')}
    </Link>
  </div>
);

const CreateCourseCardHeader = ({ t }) => (
  <div className="flex items-start gap-3.5 border-b border-[#CCFBF1] pb-6">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#CCFBF1] text-[#0F766E]">
      <BookBookmark size={22} weight="duotone" aria-hidden="true" />
    </div>
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-[#0D2E2F]">
        {t('createCourse.title')}
      </h1>
      <p className="mt-1 text-sm text-[#335C5D]">{t('createCourse.subtitle')}</p>
    </div>
  </div>
);

const CourseFormField = ({ id, errorId, label, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#0D2E2F]">
      {label}
    </label>
    {children}
    {error && (
      <p id={errorId} className="mt-1.5 text-xs font-medium text-[#DC2626]">
        {error.message}
      </p>
    )}
  </div>
);

const CreateCourseForm = ({ register, errors, loading, onSubmit, t }) => (
  <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
    <CourseFormField
      id="course-title"
      errorId="course-title-error"
      label={t('createCourse.nameLabel')}
      error={errors.title}
    >
      <input
        id="course-title"
        type="text"
        dir="auto"
        disabled={loading}
        aria-invalid={Boolean(errors.title)}
        aria-describedby={errors.title ? 'course-title-error' : undefined}
        placeholder={t('createCourse.namePlaceholder')}
        {...register('title', {
          required: t('createCourse.nameLabel'),
          validate: (value) => value.trim().length >= 3 || t('createCourse.nameLabel'),
        })}
        className={getCourseInputClass(Boolean(errors.title), 'min-h-[44px]')}
      />
    </CourseFormField>

    <CourseFormField
      id="course-description"
      errorId="course-description-error"
      label={t('createCourse.descLabel')}
      error={errors.description}
    >
      <textarea
        id="course-description"
        rows={5}
        dir="auto"
        disabled={loading}
        aria-invalid={Boolean(errors.description)}
        aria-describedby={errors.description ? 'course-description-error' : undefined}
        placeholder={t('createCourse.descPlaceholder')}
        {...register('description', {
          required: t('createCourse.descLabel'),
          validate: (value) => value.trim().length >= 10 || t('createCourse.descLabel'),
        })}
        className={getCourseInputClass(Boolean(errors.description))}
      />
    </CourseFormField>

    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#CCFBF1] pt-5">
      <Link
        to="/courses"
        className="inline-flex min-h-[44px] items-center rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-4 py-2.5 text-sm font-medium text-[#0D2E2F] hover:bg-[#CCFBF1]"
      >
        {t('common.cancel')}
      </Link>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 disabled:opacity-60"
      >
        <Plus size={16} weight="bold" aria-hidden="true" />
        {loading ? t('createCourse.submitting') : t('createCourse.submit')}
      </button>
    </div>
  </form>
);

export const CreateCourse = () => {
  const { t, tServer } = useLanguage();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, submitCount },
  } = useForm({ shouldFocusError: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      const response = await coursesAPI.create({
        title: data.title.trim(),
        description: data.description.trim(),
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
      <CreateCourseTopBar t={t} />

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#99F6E4] border-t-4 border-t-[#0F766E] bg-white shadow-xs">
        <div className="p-6 sm:p-8">
          <CreateCourseCardHeader t={t} />

          <div className="mt-6 space-y-4">
            {error && (
              <AlertBanner variant="error" onDismiss={() => setError('')}>
                {tServer(error)}
              </AlertBanner>
            )}

            <FormErrorSummary
              errors={errors}
              submitCount={submitCount}
              fieldMap={{
                title: 'course-title',
                description: 'course-description',
              }}
            />
          </div>

          <CreateCourseForm
            register={register}
            errors={errors}
            loading={loading}
            onSubmit={handleSubmit(onSubmit)}
            t={t}
          />
        </div>
      </div>
    </div>
  );
};
