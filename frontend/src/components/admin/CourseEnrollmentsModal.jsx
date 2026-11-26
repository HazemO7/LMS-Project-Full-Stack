import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Trash, UserPlus } from '@phosphor-icons/react';
import { Modal } from '../ui/Modal';
import { AlertBanner } from '../ui/AlertBanner';
import { adminAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const canSubmitEnrollment = ({ adding, loading, email, courseId }) => {
  if (adding || loading) return false;
  if (!courseId) return false;
  return Boolean(email.trim());
};

const updateIdSet = (prev, id, shouldAdd) => {
  const next = new Set(prev);
  if (shouldAdd) next.add(id);
  else next.delete(id);
  return next;
};

const EnrollmentListItem = ({ item, removingUserIds, onUnenroll, t }) => {
  const student = item.user;
  const uid = student?._id || item.user;
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[#0D2E2F]">{student?.name || uid}</p>
        <p dir="ltr" className="truncate text-start text-xs text-[#52797A]">{student?.email}</p>
      </div>
      <button
        type="button"
        disabled={removingUserIds.has(uid)}
        onClick={() => onUnenroll(uid)}
        aria-label={t('admin.unenrollAria')}
        className="rounded-lg p-1.5 text-[#52797A] hover:bg-[#FEF2F2] hover:text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash size={16} aria-hidden="true" />
      </button>
    </li>
  );
};

const EnrollmentList = ({ loading, enrollments, removingUserIds, onUnenroll, t }) => {
  if (loading) return <p className="p-4 text-center text-sm text-[#52797A]">{t('common.loading')}</p>;
  if (enrollments.length === 0) return <p className="p-4 text-center text-sm text-[#52797A]">{t('admin.noEnrollments')}</p>;
  return (
    <ul className="divide-y divide-[#CCFBF1]">
      {enrollments.map((item) => (
        <EnrollmentListItem
          key={item._id}
          item={item}
          removingUserIds={removingUserIds}
          onUnenroll={onUnenroll}
          t={t}
        />
      ))}
    </ul>
  );
};

const useCourseEnrollmentsState = (open, course, onChanged) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingUserIds, setRemovingUserIds] = useState(() => new Set());
  const [error, setError] = useState('');
  const sessionRef = useRef(0);

  const isCurrentSession = (sessionId) => sessionRef.current === sessionId;

  const loadEnrollments = useCallback(async (targetCourseId, sessionId) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getCourseEnrollments(targetCourseId);
      if (isCurrentSession(sessionId)) setEnrollments(res.data || []);
    } catch (err) {
      if (isCurrentSession(sessionId)) setError(err.message || 'Failed to load enrollments');
    } finally {
      if (isCurrentSession(sessionId)) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sessionId = ++sessionRef.current;
    setEnrollments([]);
    setError('');
    setEmail('');
    setAdding(false);
    setRemovingUserIds(new Set());
    if (!open || !course?._id) {
      setLoading(false);
      return;
    }
    loadEnrollments(course._id, sessionId);
  }, [open, course?._id, loadEnrollments]);

  const handleEnroll = async (e) => {
    e.preventDefault();
    const courseId = course?._id;
    if (!canSubmitEnrollment({ adding, loading, email, courseId })) return;
    const sessionId = sessionRef.current;
    setAdding(true);
    setError('');
    try {
      const res = await adminAPI.enrollUser(courseId, { email: email.trim() });
      onChanged?.(courseId);
      if (!isCurrentSession(sessionId)) return;
      setEnrollments((prev) => [res.data, ...prev]);
      setEmail('');
    } catch (err) {
      if (isCurrentSession(sessionId)) setError(err.message || 'Failed to enroll user');
    } finally {
      if (isCurrentSession(sessionId)) setAdding(false);
    }
  };

  const handleUnenroll = async (userId) => {
    const courseId = course?._id;
    if (!courseId || removingUserIds.has(userId)) return;
    const sessionId = sessionRef.current;
    setError('');
    setRemovingUserIds((prev) => updateIdSet(prev, userId, true));
    try {
      await adminAPI.unenrollUser(courseId, userId);
      onChanged?.(courseId);
      if (!isCurrentSession(sessionId)) return;
      setEnrollments((prev) => prev.filter((item) => (item.user?._id || item.user) !== userId));
    } catch (err) {
      if (isCurrentSession(sessionId)) setError(err.message || 'Failed to remove enrollment');
    } finally {
      if (isCurrentSession(sessionId)) setRemovingUserIds((prev) => updateIdSet(prev, userId, false));
    }
  };

  return {
    enrollments, loading, email, setEmail, adding, removingUserIds, error, handleEnroll, handleUnenroll,
  };
};

export const CourseEnrollmentsModal = ({ open, onClose, course, onChanged }) => {
  const { t, tServer } = useLanguage();
  const state = useCourseEnrollmentsState(open, course, onChanged);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('admin.manageEnrollmentsTitle')}
      description={course ? course.title : ''}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-4">
        {state.error && <AlertBanner variant="error">{tServer(state.error)}</AlertBanner>}
        <form onSubmit={state.handleEnroll} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            dir="ltr"
            required
            value={state.email}
            onChange={(e) => state.setEmail(e.target.value)}
            placeholder={t('admin.enrollEmailPh')}
            className="flex-1 rounded-lg border border-[#99F6E4] px-3.5 py-2 text-start text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
          />
          <button
            type="submit"
            disabled={state.adding || state.loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:opacity-60"
          >
            <UserPlus size={15} weight="bold" aria-hidden="true" />
            {state.adding ? t('common.saving') : t('admin.enrollStudentBtn')}
          </button>
        </form>
        <div className="max-h-72 overflow-y-auto rounded-xl border border-[#CCFBF1]">
          <EnrollmentList
            loading={state.loading}
            enrollments={state.enrollments}
            removingUserIds={state.removingUserIds}
            onUnenroll={state.handleUnenroll}
            t={t}
          />
        </div>
      </div>
    </Modal>
  );
};
