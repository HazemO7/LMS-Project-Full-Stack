import React, { useCallback, useEffect, useState } from 'react';
import { Trash, UserPlus } from '@phosphor-icons/react';
import { Modal } from '../ui/Modal';
import { AlertBanner } from '../ui/AlertBanner';
import { adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const CourseEnrollmentsModal = ({ open, onClose, course, onChanged }) => {
  const { t, tServer } = useLanguage();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const fetchEnrollments = useCallback(async () => {
    if (!course?._id) return;
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getCourseEnrollments(course._id);
      setEnrollments(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  }, [course?._id]);

  useEffect(() => {
    if (open && course?._id) {
      fetchEnrollments();
      setEmail('');
    }
  }, [open, course?._id, fetchEnrollments]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!email.trim() || !course?._id) return;
    setAdding(true);
    setError('');
    try {
      const res = await adminAPI.enrollUser(course._id, { email: email.trim() });
      setEnrollments((prev) => [res.data, ...prev]);
      setEmail('');
      onChanged?.();
    } catch (err) {
      setError(err.message || 'Failed to enroll user');
    } finally {
      setAdding(false);
    }
  };

  const handleUnenroll = async (userId) => {
    if (!course?._id) return;
    setError('');
    try {
      await adminAPI.unenrollUser(course._id, userId);
      setEnrollments((prev) => prev.filter((item) => (item.user?._id || item.user) !== userId));
      onChanged?.();
    } catch (err) {
      setError(err.message || 'Failed to remove enrollment');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('admin.manageEnrollmentsTitle')}
      description={course ? course.title : ''}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-4">
        {error && <AlertBanner variant="error">{tServer(error)}</AlertBanner>}

        <form onSubmit={handleEnroll} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            dir="ltr"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('admin.enrollEmailPh')}
            className="flex-1 rounded-lg border border-[#99F6E4] px-3.5 py-2 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:opacity-60"
          >
            <UserPlus size={15} weight="bold" aria-hidden="true" />
            {adding ? t('common.saving') : t('admin.enrollStudentBtn')}
          </button>
        </form>

        <div className="max-h-72 overflow-y-auto rounded-xl border border-[#CCFBF1]">
          {loading ? (
            <p className="p-4 text-center text-sm text-[#52797A]">{t('common.loading')}</p>
          ) : enrollments.length === 0 ? (
            <p className="p-4 text-center text-sm text-[#52797A]">{t('admin.noEnrollments')}</p>
          ) : (
            <ul className="divide-y divide-[#CCFBF1]">
              {enrollments.map((item) => {
                const student = item.user;
                const uid = student?._id || item.user;
                return (
                  <li key={item._id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#0D2E2F]">
                        {student?.name || uid}
                      </p>
                      <p dir="ltr" className="truncate text-start text-xs text-[#52797A]">
                        {student?.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnenroll(uid)}
                      aria-label={t('admin.unenrollAria')}
                      className="rounded-lg p-1.5 text-[#52797A] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                    >
                      <Trash size={16} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};
