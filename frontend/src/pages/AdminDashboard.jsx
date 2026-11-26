import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowsLeftRight,
  BookOpen,
  ChartBar,
  ClipboardText,
  Gear,
  LockOpen,
  MagnifyingGlass,
  PauseCircle,
  PlayCircle,
  ShieldCheck,
  Trash,
  UserPlus,
  Users,
  UsersThree,
} from '@phosphor-icons/react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AlertBanner } from '../components/ui/AlertBanner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CreateStaffModal } from '../components/admin/CreateStaffModal';
import { TransferCourseModal } from '../components/admin/TransferCourseModal';
import { CourseEnrollmentsModal } from '../components/admin/CourseEnrollmentsModal';

const ROLE_BADGE = {
  super_admin: 'bg-[#EDE9FE] text-[#5B21B6] ring-[#DDD6FE]',
  admin: 'bg-[#FEF2F2] text-[#991B1B] ring-[#FECACA]',
  instructor: 'bg-[#FEF3C7] text-[#92400E] ring-[#FDE68A]',
  student: 'bg-[#D1FAE5] text-[#065F46] ring-[#A7F3D0]',
};

export const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const { t, tServer } = useLanguage();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Overview stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users tab
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Courses tab
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesTotalPages, setCoursesTotalPages] = useState(1);
  const [courseSearchInput, setCourseSearchInput] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [staffPool, setStaffPool] = useState([]);
  const [transferTarget, setTransferTarget] = useState(null);
  const [enrollmentsTarget, setEnrollmentsTarget] = useState(null);

  // Settings tab (super_admin)
  const [settingsForm, setSettingsForm] = useState({
    allowPublicRegistration: true,
    maxVideoSizeMB: 250,
    maxDocumentSizeMB: 25,
    maxImageSizeMB: 10,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Audit logs tab (super_admin)
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load platform stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await adminAPI.getUsers({
        page: usersPage,
        limit: 10,
        role: roleFilter,
        status: statusFilter,
        search: userSearch,
      });
      setUsers(res.data || []);
      setUsersTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [usersPage, roleFilter, statusFilter, userSearch]);

  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const res = await adminAPI.getCourses({
        page: coursesPage,
        limit: 10,
        search: courseSearch,
      });
      setCourses(res.data || []);
      setCoursesTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setCoursesLoading(false);
    }
  }, [coursesPage, courseSearch]);

  const fetchStaffPool = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const [instRes, adminRes, superRes] = await Promise.all([
        adminAPI.getUsers({ page: 1, limit: 100, role: 'instructor', status: 'active' }),
        adminAPI.getUsers({ page: 1, limit: 100, role: 'admin', status: 'active' }),
        adminAPI.getUsers({ page: 1, limit: 100, role: 'super_admin', status: 'active' }),
      ]);
      setStaffPool([
        ...(instRes.data || []),
        ...(adminRes.data || []),
        ...(superRes.data || []),
      ]);
    } catch {
      // Non-blocking
    }
  }, [isSuperAdmin]);

  const fetchSettings = useCallback(async () => {
    if (!isSuperAdmin) return;
    setSettingsLoading(true);
    try {
      const res = await adminAPI.getSettings();
      if (res.data) {
        setSettingsForm({
          allowPublicRegistration: Boolean(res.data.allowPublicRegistration),
          maxVideoSizeMB: res.data.maxVideoSizeMB ?? 250,
          maxDocumentSizeMB: res.data.maxDocumentSizeMB ?? 25,
          maxImageSizeMB: res.data.maxImageSizeMB ?? 10,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load platform settings');
    } finally {
      setSettingsLoading(false);
    }
  }, [isSuperAdmin]);

  const fetchAuditLogs = useCallback(async () => {
    if (!isSuperAdmin) return;
    setAuditLoading(true);
    try {
      const res = await adminAPI.getAuditLogs({
        page: auditPage,
        limit: 15,
        action: auditActionFilter,
      });
      setAuditLogs(res.data || []);
      setAuditTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  }, [isSuperAdmin, auditPage, auditActionFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'courses') {
      fetchCourses();
      fetchStaffPool();
    }
  }, [activeTab, fetchCourses, fetchStaffPool]);

  useEffect(() => {
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab, fetchSettings]);

  useEffect(() => {
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, fetchAuditLogs]);

  const handleRoleChange = async (targetUser, nextRole) => {
    if (targetUser.role === nextRole) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await adminAPI.updateUserRole(targetUser._id, nextRole);
      setUsers((prev) => prev.map((u) => (u._id === targetUser._id ? res.data : u)));
      setSuccessMsg(t('admin.roleUpdatedMsg', { name: targetUser.name, role: t(`role.${nextRole}`) }));
      fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleToggleStatus = async (targetUser) => {
    setError('');
    setSuccessMsg('');
    const nextActive = targetUser.isActive === false;
    try {
      const res = await adminAPI.updateUserStatus(targetUser._id, { isActive: nextActive });
      setUsers((prev) => prev.map((u) => (u._id === targetUser._id ? res.data : u)));
      setSuccessMsg(
        nextActive
          ? t('admin.userActivatedMsg', { name: targetUser.name })
          : t('admin.userSuspendedMsg', { name: targetUser.name })
      );
      fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleUnlockUser = async (targetUser) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await adminAPI.updateUserStatus(targetUser._id, { unlock: true });
      setUsers((prev) => prev.map((u) => (u._id === targetUser._id ? res.data : u)));
      setSuccessMsg(t('admin.userUnlockedMsg', { name: targetUser.name }));
    } catch (err) {
      setError(err.message || 'Failed to unlock user');
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!deleteUserTarget) return;
    setDeletingUser(true);
    setError('');
    setSuccessMsg('');
    try {
      await adminAPI.deleteUser(deleteUserTarget._id);
      setUsers((prev) => prev.filter((u) => u._id !== deleteUserTarget._id));
      setSuccessMsg(t('admin.userDeletedMsg', { name: deleteUserTarget.name }));
      setDeleteUserTarget(null);
      fetchStats();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
      setDeleteUserTarget(null);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await adminAPI.updateSettings({
        allowPublicRegistration: settingsForm.allowPublicRegistration,
        maxVideoSizeMB: Number(settingsForm.maxVideoSizeMB),
        maxDocumentSizeMB: Number(settingsForm.maxDocumentSizeMB),
        maxImageSizeMB: Number(settingsForm.maxImageSizeMB),
      });
      setSuccessMsg(t('admin.settingsSavedMsg'));
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  const tabs = [
    { id: 'overview', label: t('admin.tabOverview'), icon: ChartBar },
    { id: 'users', label: t('admin.tabUsers'), icon: Users },
    { id: 'courses', label: t('admin.tabCourses'), icon: BookOpen },
    ...(isSuperAdmin
      ? [
          { id: 'settings', label: t('admin.tabSettings'), icon: Gear },
          { id: 'audit', label: t('admin.tabAudit'), icon: ClipboardText },
        ]
      : []),
  ];

  const canModifyTargetUser = (targetUser) => {
    if (isSuperAdmin) return true;
    return targetUser.role !== 'admin' && targetUser.role !== 'super_admin';
  };

  return (
    <div>
      {/* Ocean Header */}
      <section className="ocean-grid-bg border-b border-[#1E6466] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#114B4D] text-[#F59E0B] ring-1 ring-[#F59E0B]/40">
              <ShieldCheck size={28} weight="duotone" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {t('admin.title')}
                </h1>
                <span className="rounded-md bg-[#F59E0B] px-2 py-0.5 text-xs font-bold text-[#0B3B3C]">
                  {t(`role.${currentUser?.role || 'admin'}`)}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#CCFBF1]/85">
                {isSuperAdmin ? t('admin.superSubtitle') : t('admin.adminSubtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTab('users');
              setShowCreateStaff(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-sm font-bold text-[#0B3B3C] transition-colors hover:bg-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]"
          >
            <UserPlus size={17} weight="bold" aria-hidden="true" />
            {t('admin.addInstructorCta')}
          </button>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div
          role="tablist"
          aria-label={t('admin.tabsAria')}
          className="mb-6 flex flex-wrap gap-2 rounded-xl border border-[#99F6E4] bg-white p-1.5 shadow-xs"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[#0D9488] text-white'
                    : 'text-[#335C5D] hover:bg-[#F0FDFA] hover:text-[#0B3B3C]'
                }`}
              >
                <Icon size={16} weight={active ? 'fill' : 'duotone'} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {error && (
          <AlertBanner variant="error" className="mb-6" onDismiss={() => setError('')}>
            {tServer(error)}
          </AlertBanner>
        )}
        {successMsg && (
          <AlertBanner variant="success" className="mb-6" onDismiss={() => setSuccessMsg('')}>
            {successMsg}
          </AlertBanner>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {statsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-xl border border-[#99F6E4] bg-white" />
                ))}
              </div>
            ) : stats ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-[#99F6E4] bg-white p-5 shadow-xs">
                    <p className="text-xs font-semibold text-[#52797A]">{t('admin.kpiUsers')}</p>
                    <p className="mt-2 font-mono-tabular text-3xl font-bold text-[#0D2E2F]">
                      {stats.users.total}
                    </p>
                    <p className="mt-1 text-xs text-[#0F766E]">
                      {t('admin.kpiActiveSuspended', {
                        active: stats.users.active,
                        suspended: stats.users.suspended,
                      })}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#99F6E4] bg-white p-5 shadow-xs">
                    <p className="text-xs font-semibold text-[#52797A]">{t('admin.kpiInstructors')}</p>
                    <p className="mt-2 font-mono-tabular text-3xl font-bold text-[#D97706]">
                      {stats.users.instructors}
                    </p>
                    <p className="mt-1 text-xs text-[#335C5D]">
                      {t('admin.kpiAdminsCount', {
                        count: stats.users.admins + stats.users.superAdmins,
                      })}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#99F6E4] bg-white p-5 shadow-xs">
                    <p className="text-xs font-semibold text-[#52797A]">{t('admin.kpiStudents')}</p>
                    <p className="mt-2 font-mono-tabular text-3xl font-bold text-[#059669]">
                      {stats.users.students}
                    </p>
                    <p className="mt-1 text-xs text-[#335C5D]">
                      {t('admin.kpiEnrollments', { count: stats.enrollments.total })}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#99F6E4] bg-white p-5 shadow-xs">
                    <p className="text-xs font-semibold text-[#52797A]">{t('admin.kpiCourses')}</p>
                    <p className="mt-2 font-mono-tabular text-3xl font-bold text-[#0284C7]">
                      {stats.courses.total}
                    </p>
                    <p className="mt-1 text-xs text-[#335C5D]">
                      {t('admin.kpiLessons', { count: stats.lessons.total })}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#99F6E4] bg-white p-6 shadow-xs">
                  <h2 className="font-display text-lg font-semibold text-[#0D2E2F]">
                    {t('admin.quickActionsTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-[#335C5D]">{t('admin.quickActionsDesc')}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('users');
                        setShowCreateStaff(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]"
                    >
                      <UserPlus size={16} weight="bold" aria-hidden="true" />
                      {t('admin.addInstructorCta')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('courses')}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-4 py-2 text-sm font-semibold text-[#0D2E2F] hover:bg-[#CCFBF1]"
                    >
                      <BookOpen size={16} weight="duotone" aria-hidden="true" />
                      {t('admin.tabCourses')}
                    </button>
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('audit')}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-4 py-2 text-sm font-semibold text-[#0D2E2F] hover:bg-[#CCFBF1]"
                      >
                        <ClipboardText size={16} weight="duotone" aria-hidden="true" />
                        {t('admin.tabAudit')}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* USERS & INSTRUCTORS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#99F6E4] bg-white p-4 shadow-xs lg:flex-row lg:items-center">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setUsersPage(1);
                  setUserSearch(userSearchInput.trim());
                }}
                className="flex flex-1 flex-wrap items-center gap-2"
              >
                <div className="relative min-w-[220px] flex-1">
                  <MagnifyingGlass
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-[#52797A]"
                  />
                  <input
                    type="text"
                    value={userSearchInput}
                    onChange={(e) => setUserSearchInput(e.target.value)}
                    placeholder={t('admin.searchUsersPh')}
                    className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/50 py-2 ps-9 pe-3 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:bg-white focus:outline-none"
                  />
                </div>
                <select
                  aria-label={t('admin.filterByRole')}
                  value={roleFilter}
                  onChange={(e) => {
                    setUsersPage(1);
                    setRoleFilter(e.target.value);
                  }}
                  className="rounded-lg border border-[#99F6E4] bg-white px-3 py-2 text-sm text-[#0D2E2F]"
                >
                  <option value="all">{t('admin.allRoles')}</option>
                  <option value="super_admin">{t('role.super_admin')}</option>
                  <option value="admin">{t('role.admin')}</option>
                  <option value="instructor">{t('role.instructor')}</option>
                  <option value="student">{t('role.student')}</option>
                </select>
                <select
                  aria-label={t('admin.filterByStatus')}
                  value={statusFilter}
                  onChange={(e) => {
                    setUsersPage(1);
                    setStatusFilter(e.target.value);
                  }}
                  className="rounded-lg border border-[#99F6E4] bg-white px-3 py-2 text-sm text-[#0D2E2F]"
                >
                  <option value="all">{t('admin.allStatuses')}</option>
                  <option value="active">{t('admin.statusActive')}</option>
                  <option value="suspended">{t('admin.statusSuspended')}</option>
                  <option value="locked">{t('admin.statusLocked')}</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]"
                >
                  {t('courses.searchBtn')}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setShowCreateStaff(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0B3B3C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#114B4D]"
              >
                <UserPlus size={16} weight="bold" aria-hidden="true" className="text-[#F59E0B]" />
                {t('admin.addStaffBtn')}
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-start text-sm">
                  <thead className="border-b border-[#CCFBF1] bg-[#F0FDFA] text-xs font-semibold text-[#0F766E]">
                    <tr>
                      <th className="px-4 py-3 text-start">{t('admin.colUser')}</th>
                      <th className="px-4 py-3 text-start">{t('admin.colRole')}</th>
                      <th className="px-4 py-3 text-start">{t('admin.colStatus')}</th>
                      <th className="px-4 py-3 text-end">{t('admin.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CCFBF1]">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[#52797A]">
                          {t('common.loading')}
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[#52797A]">
                          {t('admin.noUsersFound')}
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const editable = canModifyTargetUser(u);
                        const isSelf = u._id === currentUser?._id;
                        const isLocked = u.lockUntil && new Date(u.lockUntil).getTime() > Date.now();
                        const suspended = u.isActive === false;

                        return (
                          <tr key={u._id} className="hover:bg-[#F0FDFA]/50">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#0D2E2F]">{u.name}</p>
                              <p dir="ltr" className="text-start text-xs text-[#52797A]">
                                {u.email}
                              </p>
                              {u.specialty && (
                                <p className="mt-0.5 text-xs text-[#0F766E]">{u.specialty}</p>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {editable ? (
                                <select
                                  aria-label={t('admin.changeRoleAria', { name: u.name })}
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u, e.target.value)}
                                  className="rounded-lg border border-[#99F6E4] bg-white px-2.5 py-1 text-xs font-semibold text-[#0D2E2F]"
                                >
                                  <option value="student">{t('role.student')}</option>
                                  <option value="instructor">{t('role.instructor')}</option>
                                  {isSuperAdmin && <option value="admin">{t('role.admin')}</option>}
                                  {isSuperAdmin && (
                                    <option value="super_admin">{t('role.super_admin')}</option>
                                  )}
                                </select>
                              ) : (
                                <span
                                  className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
                                    ROLE_BADGE[u.role] || ROLE_BADGE.student
                                  }`}
                                >
                                  {t(`role.${u.role}`)}
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
                                    suspended
                                      ? 'bg-[#FEF2F2] text-[#991B1B] ring-[#FECACA]'
                                      : 'bg-[#D1FAE5] text-[#065F46] ring-[#A7F3D0]'
                                  }`}
                                >
                                  {suspended ? t('admin.statusSuspended') : t('admin.statusActive')}
                                </span>
                                {isLocked && (
                                  <span className="rounded-md bg-[#FEF3C7] px-2 py-0.5 text-xs font-semibold text-[#92400E] ring-1 ring-[#FDE68A]">
                                    {t('admin.statusLocked')}
                                  </span>
                                )}
                                {u.mustChangePassword && (
                                  <span className="rounded-md bg-[#E0F2FE] px-2 py-0.5 text-[11px] font-semibold text-[#0369A1]">
                                    {t('admin.tempPwBadge')}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-end">
                              <div className="inline-flex items-center gap-1.5">
                                {editable && isLocked && (
                                  <button
                                    type="button"
                                    onClick={() => handleUnlockUser(u)}
                                    title={t('admin.unlockAccount')}
                                    className="rounded-lg border border-[#FDE68A] bg-[#FEF3C7] p-1.5 text-[#92400E] hover:bg-[#FDE68A]"
                                  >
                                    <LockOpen size={15} aria-hidden="true" />
                                  </button>
                                )}
                                {editable && !isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(u)}
                                    title={
                                      suspended
                                        ? t('admin.activateAccount')
                                        : t('admin.suspendAccount')
                                    }
                                    className={`rounded-lg border p-1.5 ${
                                      suspended
                                        ? 'border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46] hover:bg-[#A7F3D0]'
                                        : 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2]'
                                    }`}
                                  >
                                    {suspended ? (
                                      <PlayCircle size={15} aria-hidden="true" />
                                    ) : (
                                      <PauseCircle size={15} aria-hidden="true" />
                                    )}
                                  </button>
                                )}
                                {isSuperAdmin && !isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteUserTarget(u)}
                                    title={t('admin.deleteUserTitle')}
                                    className="rounded-lg border border-[#FECACA] bg-white p-1.5 text-[#DC2626] hover:bg-[#FEF2F2]"
                                  >
                                    <Trash size={15} aria-hidden="true" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {usersTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#CCFBF1] px-4 py-3 text-xs">
                  <button
                    type="button"
                    disabled={usersPage <= 1}
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-[#99F6E4] px-3 py-1.5 font-semibold text-[#0D2E2F] disabled:opacity-40"
                  >
                    {t('courses.prev')}
                  </button>
                  <span className="font-mono-tabular font-semibold text-[#0F766E]">
                    {t('courses.pageOf', { page: usersPage, total: usersTotalPages })}
                  </span>
                  <button
                    type="button"
                    disabled={usersPage >= usersTotalPages}
                    onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                    className="rounded-lg border border-[#99F6E4] px-3 py-1.5 font-semibold text-[#0D2E2F] disabled:opacity-40"
                  >
                    {t('courses.next')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COURSES & ENROLLMENTS TAB */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#99F6E4] bg-white p-4 shadow-xs">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCoursesPage(1);
                  setCourseSearch(courseSearchInput.trim());
                }}
                className="flex flex-1 items-center gap-2"
              >
                <div className="relative max-w-md flex-1">
                  <MagnifyingGlass
                    size={16}
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-[#52797A]"
                  />
                  <input
                    type="text"
                    value={courseSearchInput}
                    onChange={(e) => setCourseSearchInput(e.target.value)}
                    placeholder={t('courses.searchPlaceholder')}
                    className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/50 py-2 ps-9 pe-3 text-sm text-[#0D2E2F]"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]"
                >
                  {t('courses.searchBtn')}
                </button>
              </form>

              <Link
                to="/course/new"
                className="rounded-lg bg-[#0B3B3C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#114B4D]"
              >
                {t('nav.createCourse')}
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-start text-sm">
                  <thead className="border-b border-[#CCFBF1] bg-[#F0FDFA] text-xs font-semibold text-[#0F766E]">
                    <tr>
                      <th className="px-4 py-3 text-start">{t('admin.colCourse')}</th>
                      <th className="px-4 py-3 text-start">{t('admin.colInstructor')}</th>
                      <th className="px-4 py-3 text-start">{t('admin.colMetrics')}</th>
                      <th className="px-4 py-3 text-end">{t('admin.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CCFBF1]">
                    {coursesLoading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[#52797A]">
                          {t('common.loading')}
                        </td>
                      </tr>
                    ) : courses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[#52797A]">
                          {t('courses.emptyAllTitle')}
                        </td>
                      </tr>
                    ) : (
                      courses.map((c) => (
                        <tr key={c._id} className="hover:bg-[#F0FDFA]/50">
                          <td className="px-4 py-3">
                            <Link
                              to={`/course/${c._id}`}
                              className="font-semibold text-[#0D2E2F] hover:text-[#0D9488]"
                            >
                              {c.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            {c.instructor ? (
                              <div>
                                <p className="font-medium text-[#0D2E2F]">{c.instructor.name}</p>
                                <p dir="ltr" className="text-start text-xs text-[#52797A]">
                                  {c.instructor.email}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-[#52797A]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono-tabular text-xs text-[#335C5D]">
                            {c.moduleCount ?? 0} {t('admin.modulesShort')} · {c.enrollmentCount ?? 0}{' '}
                            {t('admin.studentsShort')}
                          </td>
                          <td className="px-4 py-3 text-end">
                            <div className="inline-flex flex-wrap items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEnrollmentsTarget(c)}
                                className="inline-flex items-center gap-1 rounded-lg border border-[#99F6E4] bg-[#F0FDFA] px-2.5 py-1.5 text-xs font-semibold text-[#0F766E] hover:bg-[#CCFBF1]"
                              >
                                <UsersThree size={14} aria-hidden="true" />
                                {t('admin.enrollmentsBtn')}
                              </button>
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() => setTransferTarget(c)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-1.5 text-xs font-semibold text-[#92400E] hover:bg-[#FDE68A]"
                                >
                                  <ArrowsLeftRight size={14} aria-hidden="true" />
                                  {t('admin.transferBtn')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {coursesTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#CCFBF1] px-4 py-3 text-xs">
                  <button
                    type="button"
                    disabled={coursesPage <= 1}
                    onClick={() => setCoursesPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-[#99F6E4] px-3 py-1.5 font-semibold text-[#0D2E2F] disabled:opacity-40"
                  >
                    {t('courses.prev')}
                  </button>
                  <span className="font-mono-tabular font-semibold text-[#0F766E]">
                    {t('courses.pageOf', { page: coursesPage, total: coursesTotalPages })}
                  </span>
                  <button
                    type="button"
                    disabled={coursesPage >= coursesTotalPages}
                    onClick={() => setCoursesPage((p) => Math.min(coursesTotalPages, p + 1))}
                    className="rounded-lg border border-[#99F6E4] px-3 py-1.5 font-semibold text-[#0D2E2F] disabled:opacity-40"
                  >
                    {t('courses.next')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PLATFORM SETTINGS TAB (SUPER ADMIN ONLY) */}
        {activeTab === 'settings' && isSuperAdmin && (
          <div className="max-w-2xl rounded-2xl border border-[#99F6E4] bg-white p-6 shadow-xs">
            <h2 className="font-display text-lg font-semibold text-[#0D2E2F]">
              {t('admin.settingsTitle')}
            </h2>
            <p className="mt-1 text-xs text-[#335C5D]">{t('admin.settingsDesc')}</p>

            {settingsLoading ? (
              <p className="mt-6 text-sm text-[#52797A]">{t('common.loading')}</p>
            ) : (
              <form onSubmit={handleSaveSettings} className="mt-6 space-y-5">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#CCFBF1] bg-[#F0FDFA]/60 p-4">
                  <input
                    type="checkbox"
                    checked={settingsForm.allowPublicRegistration}
                    onChange={(e) =>
                      setSettingsForm((p) => ({
                        ...p,
                        allowPublicRegistration: e.target.checked,
                      }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-[#5EEAD4] text-[#0D9488]"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-[#0D2E2F]">
                      {t('admin.allowPublicRegLabel')}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#335C5D]">
                      {t('admin.allowPublicRegHint')}
                    </span>
                  </div>
                </label>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="setting-video-mb"
                      className="mb-1.5 block text-xs font-semibold text-[#0D2E2F]"
                    >
                      {t('admin.maxVideoSizeLabel')}
                    </label>
                    <input
                      id="setting-video-mb"
                      type="number"
                      min={10}
                      max={2048}
                      value={settingsForm.maxVideoSizeMB}
                      onChange={(e) =>
                        setSettingsForm((p) => ({ ...p, maxVideoSizeMB: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#99F6E4] px-3 py-2 text-sm text-[#0D2E2F]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="setting-doc-mb"
                      className="mb-1.5 block text-xs font-semibold text-[#0D2E2F]"
                    >
                      {t('admin.maxDocSizeLabel')}
                    </label>
                    <input
                      id="setting-doc-mb"
                      type="number"
                      min={1}
                      max={250}
                      value={settingsForm.maxDocumentSizeMB}
                      onChange={(e) =>
                        setSettingsForm((p) => ({ ...p, maxDocumentSizeMB: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#99F6E4] px-3 py-2 text-sm text-[#0D2E2F]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="setting-img-mb"
                      className="mb-1.5 block text-xs font-semibold text-[#0D2E2F]"
                    >
                      {t('admin.maxImgSizeLabel')}
                    </label>
                    <input
                      id="setting-img-mb"
                      type="number"
                      min={1}
                      max={50}
                      value={settingsForm.maxImageSizeMB}
                      onChange={(e) =>
                        setSettingsForm((p) => ({ ...p, maxImageSizeMB: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#99F6E4] px-3 py-2 text-sm text-[#0D2E2F]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="rounded-lg bg-[#0D9488] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0F766E] disabled:opacity-60"
                >
                  {settingsSaving ? t('common.saving') : t('admin.saveSettingsBtn')}
                </button>
              </form>
            )}
          </div>
        )}

        {/* AUDIT LOGS TAB (SUPER ADMIN ONLY) */}
        {activeTab === 'audit' && isSuperAdmin && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#99F6E4] bg-white p-4 shadow-xs">
              <p className="text-sm font-semibold text-[#0D2E2F]">{t('admin.auditDesc')}</p>
              <select
                aria-label={t('admin.filterByAction')}
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditPage(1);
                  setAuditActionFilter(e.target.value);
                }}
                className="rounded-lg border border-[#99F6E4] bg-white px-3 py-1.5 text-xs font-semibold text-[#0D2E2F]"
              >
                <option value="all">{t('admin.allActions')}</option>
                <option value="USER_CREATED">USER_CREATED</option>
                <option value="ROLE_UPDATED">ROLE_UPDATED</option>
                <option value="USER_STATUS_CHANGED">USER_STATUS_CHANGED</option>
                <option value="USER_UNLOCKED">USER_UNLOCKED</option>
                <option value="USER_DELETED">USER_DELETED</option>
                <option value="COURSE_TRANSFERRED">COURSE_TRANSFERRED</option>
                <option value="ENROLLMENT_ADDED">ENROLLMENT_ADDED</option>
                <option value="ENROLLMENT_REMOVED">ENROLLMENT_REMOVED</option>
                <option value="SETTINGS_UPDATED">SETTINGS_UPDATED</option>
              </select>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-start text-xs">
                  <thead className="border-b border-[#CCFBF1] bg-[#F0FDFA] font-semibold text-[#0F766E]">
                    <tr>
                      <th className="px-4 py-3 text-start">{t('admin.colTime')}</th>
                      <th className="px-4 py-3 text-start">{t('admin.colActor')}</th>
                      <th className="px-4 py-3 text-start">{t('admin.colAction')}</th>
                      <th className="px-4 py-3 text-start">{t('admin.colDetails')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CCFBF1]">
                    {auditLoading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[#52797A]">
                          {t('common.loading')}
                        </td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-[#52797A]">
                          {t('admin.noAuditLogs')}
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-[#F0FDFA]/50">
                          <td dir="ltr" className="whitespace-nowrap px-4 py-2.5 font-mono-tabular text-[#52797A]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-semibold text-[#0D2E2F]">
                              {log.actor?.name || 'System'}
                            </span>
                            {log.actor?.email && (
                              <span dir="ltr" className="block text-[11px] text-[#52797A]">
                                {log.actor.email}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="rounded bg-[#CCFBF1] px-2 py-0.5 font-mono-tabular font-semibold text-[#0F766E]">
                              {log.action}
                            </span>
                          </td>
                          <td dir="ltr" className="max-w-xs truncate px-4 py-2.5 font-mono-tabular text-[#335C5D]">
                            {JSON.stringify(log.metadata || {})}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {auditTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#CCFBF1] px-4 py-3 text-xs">
                  <button
                    type="button"
                    disabled={auditPage <= 1}
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-[#99F6E4] px-3 py-1.5 font-semibold text-[#0D2E2F] disabled:opacity-40"
                  >
                    {t('courses.prev')}
                  </button>
                  <span className="font-mono-tabular font-semibold text-[#0F766E]">
                    {t('courses.pageOf', { page: auditPage, total: auditTotalPages })}
                  </span>
                  <button
                    type="button"
                    disabled={auditPage >= auditTotalPages}
                    onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                    className="rounded-lg border border-[#99F6E4] px-3 py-1.5 font-semibold text-[#0D2E2F] disabled:opacity-40"
                  >
                    {t('courses.next')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateStaffModal
        open={showCreateStaff}
        onClose={() => setShowCreateStaff(false)}
        callerRole={currentUser?.role}
        onCreated={() => {
          fetchUsers();
          fetchStats();
        }}
      />

      <TransferCourseModal
        open={Boolean(transferTarget)}
        onClose={() => setTransferTarget(null)}
        course={transferTarget}
        instructors={staffPool}
        onTransferred={(updatedCourse) => {
          setCourses((prev) =>
            prev.map((c) => (c._id === updatedCourse._id ? { ...c, ...updatedCourse } : c))
          );
          setSuccessMsg(t('admin.courseTransferredMsg', { title: updatedCourse.title }));
        }}
      />

      <CourseEnrollmentsModal
        open={Boolean(enrollmentsTarget)}
        onClose={() => setEnrollmentsTarget(null)}
        course={enrollmentsTarget}
        onChanged={() => {
          fetchCourses();
          fetchStats();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteUserTarget)}
        onClose={() => !deletingUser && setDeleteUserTarget(null)}
        onConfirm={handleDeleteUserConfirm}
        loading={deletingUser}
        title={t('admin.deleteUserTitle')}
        message={
          deleteUserTarget
            ? t('admin.deleteUserConfirm', {
                name: deleteUserTarget.name,
                email: deleteUserTarget.email,
              })
            : ''
        }
        confirmLabel={t('admin.deleteUserTitle')}
      />
    </div>
  );
};
