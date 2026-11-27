import React, { useCallback, useState } from 'react';
import { ShieldCheck, UserPlus } from '@phosphor-icons/react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AlertBanner } from '../components/ui/AlertBanner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CreateStaffModal } from '../components/admin/CreateStaffModal';
import { TransferCourseModal } from '../components/admin/TransferCourseModal';
import { CourseEnrollmentsModal } from '../components/admin/CourseEnrollmentsModal';
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { AdminCoursesTab } from '../components/admin/AdminCoursesTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { AdminAuditLogsTab } from '../components/admin/AdminAuditLogsTab';
import { getAdminTabs } from '../components/admin/adminConstants';
import {
  useAdminAuditLogs,
  useAdminCourses,
  useAdminSettings,
  useAdminStaffPool,
  useAdminStats,
  useAdminUsers,
} from '../components/admin/useAdminResources';

const AdminHeroHeader = ({ callerRole, isSuperAdmin, onAddStaff, t }) => (
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
              {t(`role.${callerRole || 'admin'}`)}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#CCFBF1]/85">
            {isSuperAdmin ? t('admin.superSubtitle') : t('admin.adminSubtitle')}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAddStaff}
        className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2.5 text-sm font-bold text-[#0B3B3C] transition-colors hover:bg-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]"
      >
        <UserPlus size={17} weight="bold" aria-hidden="true" />
        {t('admin.addInstructorCta')}
      </button>
    </div>
  </section>
);

const AdminTabBar = ({ tabs, activeTab, onSelectTab, t }) => (
  <div
    role="tablist"
    aria-label={t('admin.tabsAria')}
    className="mb-6 flex flex-wrap gap-2 rounded-xl border border-[#99F6E4] bg-white p-1.5 shadow-xs"
  >
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const active = activeTab === tab.id;
      const tabStyle = active ? 'bg-[#0D9488] text-white' : 'text-[#335C5D] hover:bg-[#F0FDFA] hover:text-[#0B3B3C]';
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onSelectTab(tab.id)}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tabStyle}`}
        >
          <Icon size={16} weight={active ? 'fill' : 'duotone'} aria-hidden="true" />
          {tab.label}
        </button>
      );
    })}
  </div>
);

const AdminTabContent = ({
  activeTab, isSuperAdmin, currentUserId, stats, statsLoading, usersState,
  coursesState, settingsState, auditState, handlers, t, tServer,
}) => {
  if (activeTab === 'overview') {
    return (
      <AdminOverviewTab
        stats={stats}
        statsLoading={statsLoading}
        isSuperAdmin={isSuperAdmin}
        onOpenCreateStaff={handlers.openCreateStaff}
        onSelectTab={handlers.setActiveTab}
        t={t}
      />
    );
  }
  if (activeTab === 'users') {
    return (
      <AdminUsersTab
        users={usersState.users}
        nowMs={usersState.fetchedAt}
        loading={usersState.usersLoading}
        page={usersState.usersPage}
        totalPages={usersState.usersTotalPages}
        currentUserId={currentUserId}
        isSuperAdmin={isSuperAdmin}
        onOpenCreateStaff={() => handlers.setShowCreateStaff(true)}
        onPageChange={usersState.setUsersPage}
        filters={handlers.userFilters}
        actions={handlers.userActions}
        t={t}
      />
    );
  }
  if (activeTab === 'courses') {
    return (
      <AdminCoursesTab
        courses={coursesState.courses}
        loading={coursesState.coursesLoading}
        page={coursesState.coursesPage}
        totalPages={coursesState.coursesTotalPages}
        searchInput={coursesState.courseSearchInput}
        isSuperAdmin={isSuperAdmin}
        onSearchInputChange={coursesState.setCourseSearchInput}
        onSearchSubmit={handlers.onCourseSearchSubmit}
        onPageChange={coursesState.setCoursesPage}
        onOpenEnrollments={handlers.setEnrollmentsTarget}
        onOpenTransfer={handlers.setTransferTarget}
        t={t}
      />
    );
  }
  if (activeTab === 'settings' && isSuperAdmin) {
    return (
      <AdminSettingsTab
        form={settingsState.settingsForm}
        loaded={settingsState.settingsLoaded}
        loading={settingsState.settingsLoading}
        saving={settingsState.settingsSaving}
        loadError={settingsState.settingsLoadError}
        onRetry={settingsState.fetchSettings}
        onFieldChange={handlers.onSettingsFieldChange}
        onSubmit={settingsState.handleSaveSettings}
        t={t}
        tServer={tServer}
      />
    );
  }
  if (activeTab === 'audit' && isSuperAdmin) {
    return (
      <AdminAuditLogsTab
        logs={auditState.auditLogs}
        loading={auditState.auditLoading}
        page={auditState.auditPage}
        totalPages={auditState.auditTotalPages}
        actionFilter={auditState.auditActionFilter}
        expandedIds={auditState.expandedAuditIds}
        onActionFilterChange={handlers.onAuditActionChange}
        onPageChange={auditState.setAuditPage}
        onToggleDetails={auditState.toggleAuditDetails}
        t={t}
      />
    );
  }
  return null;
};

const AdminDashboardModals = ({
  callerRole, showCreateStaff, closeCreateStaff, transferTarget, closeTransfer,
  enrollmentsTarget, closeEnrollments, deleteUserTarget, closeDeleteConfirm,
  deletingUser, onDeleteConfirm, staffState, coursesState, usersState, fetchStats, setSuccessMsg, t,
}) => (
  <>
    <CreateStaffModal
      open={showCreateStaff}
      onClose={closeCreateStaff}
      callerRole={callerRole}
      onCreated={() => {
        usersState.refreshUsers();
        fetchStats();
      }}
    />
    <TransferCourseModal
      open={Boolean(transferTarget)}
      onClose={closeTransfer}
      course={transferTarget}
      instructors={staffState.staffPool}
      staffLoading={staffState.staffPoolLoading}
      staffError={staffState.staffPoolError}
      onRetryStaff={staffState.fetchStaffPool}
      onTransferred={(updated) => {
        coursesState.setCourses((prev) => prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c)));
        setSuccessMsg(t('admin.courseTransferredMsg', { title: updated.title }));
      }}
    />
    <CourseEnrollmentsModal
      open={Boolean(enrollmentsTarget)}
      onClose={closeEnrollments}
      course={enrollmentsTarget}
      onChanged={() => {
        coursesState.refreshCourses();
        fetchStats();
      }}
    />
    <ConfirmDialog
      open={Boolean(deleteUserTarget)}
      onClose={closeDeleteConfirm}
      onConfirm={onDeleteConfirm}
      loading={deletingUser}
      title={t('admin.deleteUserTitle')}
      message={deleteUserTarget ? t('admin.deleteUserConfirm', { name: deleteUserTarget.name, email: deleteUserTarget.email }) : ''}
      confirmLabel={t('admin.deleteUserTitle')}
    />
  </>
);

const createDashboardHandlers = ({
  coursesState, usersState, settingsState, auditState, successMsg, setSuccessMsg,
  setActiveTab, setShowCreateStaff, setEnrollmentsTarget, setTransferTarget,
  setDeleteUserTarget, runUserMutation, t,
}) => ({
  openCreateStaff: () => {
    setActiveTab('users');
    setShowCreateStaff(true);
  },
  setActiveTab,
  setShowCreateStaff,
  setEnrollmentsTarget,
  setTransferTarget,
  onCourseSearchSubmit: (e) => {
    e.preventDefault();
    coursesState.setCoursesPage(1);
    coursesState.setCourseSearch(coursesState.courseSearchInput.trim());
  },
  onSettingsFieldChange: (field, value) => {
    if (successMsg) setSuccessMsg('');
    settingsState.setSettingsForm((p) => ({ ...p, [field]: value }));
  },
  onAuditActionChange: (val) => {
    auditState.setAuditPage(1);
    auditState.setAuditActionFilter(val);
  },
  userFilters: {
    searchInput: usersState.userSearchInput,
    roleFilter: usersState.roleFilter,
    statusFilter: usersState.statusFilter,
    onSearchInputChange: usersState.setUserSearchInput,
    onSearchSubmit: (e) => {
      e.preventDefault();
      usersState.setUsersPage(1);
      usersState.setUserSearch(usersState.userSearchInput.trim());
    },
    onRoleFilterChange: (val) => {
      usersState.setUsersPage(1);
      usersState.setRoleFilter(val);
    },
    onStatusFilterChange: (val) => {
      usersState.setUsersPage(1);
      usersState.setStatusFilter(val);
    },
  },
  userActions: {
    onRoleChange: (u, nextRole) => u.role !== nextRole && runUserMutation(
      () => adminAPI.updateUserRole(u._id, nextRole),
      t('admin.roleUpdatedMsg', { name: u.name, role: t(`role.${nextRole}`) }),
      'Failed to update user role'
    ),
    onToggleStatus: (u) => {
      const nextActive = u.isActive === false;
      const msgKey = nextActive ? 'admin.userActivatedMsg' : 'admin.userSuspendedMsg';
      return runUserMutation(() => adminAPI.updateUserStatus(u._id, { isActive: nextActive }), t(msgKey, { name: u.name }), 'Failed to update user status');
    },
    onUnlockUser: (u) => runUserMutation(() => adminAPI.updateUserStatus(u._id, { unlock: true }), t('admin.userUnlockedMsg', { name: u.name }), 'Failed to unlock user'),
    onDeleteUser: setDeleteUserTarget,
  },
});

export const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const { t, tServer } = useLanguage();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null);
  const [enrollmentsTarget, setEnrollmentsTarget] = useState(null);

  const { stats, statsLoading, fetchStats } = useAdminStats(setError);
  const usersState = useAdminUsers(activeTab, setError);
  const coursesState = useAdminCourses(activeTab, setError);
  const staffState = useAdminStaffPool(activeTab, isSuperAdmin);
  const settingsState = useAdminSettings(activeTab, isSuperAdmin, setError, setSuccessMsg, t);
  const auditState = useAdminAuditLogs(activeTab, isSuperAdmin, setError);

  const refreshGovernanceViews = () => {
    usersState.refreshUsers();
    fetchStats();
    if (isSuperAdmin) staffState.fetchStaffPool();
  };

  const runUserMutation = async (fn, successText, fallbackError) => {
    setError('');
    setSuccessMsg('');
    try {
      await fn();
      setSuccessMsg(successText);
      refreshGovernanceViews();
    } catch (err) {
      setError(err.message || fallbackError);
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!deleteUserTarget) return;
    setDeletingUser(true);
    await runUserMutation(
      () => adminAPI.deleteUser(deleteUserTarget._id),
      t('admin.userDeletedMsg', { name: deleteUserTarget.name }),
      'Failed to delete user'
    );
    setDeleteUserTarget(null);
    setDeletingUser(false);
  };

  const closeCreateStaff = useCallback(() => setShowCreateStaff(false), []);
  const closeTransfer = useCallback(() => setTransferTarget(null), []);
  const closeEnrollments = useCallback(() => setEnrollmentsTarget(null), []);
  const closeDeleteConfirm = useCallback(() => {
    if (!deletingUser) setDeleteUserTarget(null);
  }, [deletingUser]);

  const handlers = createDashboardHandlers({
    coursesState, usersState, settingsState, auditState, successMsg, setSuccessMsg,
    setActiveTab, setShowCreateStaff, setEnrollmentsTarget, setTransferTarget,
    setDeleteUserTarget, runUserMutation, t,
  });

  return (
    <div>
      <AdminHeroHeader callerRole={currentUser?.role} isSuperAdmin={isSuperAdmin} onAddStaff={handlers.openCreateStaff} t={t} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminTabBar tabs={getAdminTabs(isSuperAdmin, t)} activeTab={activeTab} onSelectTab={setActiveTab} t={t} />
        {error && <AlertBanner variant="error" className="mb-6" onDismiss={() => setError('')}>{tServer(error)}</AlertBanner>}
        {successMsg && <AlertBanner variant="success" className="mb-6" onDismiss={() => setSuccessMsg('')}>{successMsg}</AlertBanner>}
        <AdminTabContent
          activeTab={activeTab}
          isSuperAdmin={isSuperAdmin}
          currentUserId={currentUser?._id}
          stats={stats}
          statsLoading={statsLoading}
          usersState={usersState}
          coursesState={coursesState}
          settingsState={settingsState}
          auditState={auditState}
          handlers={handlers}
          t={t}
          tServer={tServer}
        />
      </div>
      <AdminDashboardModals
        callerRole={currentUser?.role}
        showCreateStaff={showCreateStaff}
        closeCreateStaff={closeCreateStaff}
        transferTarget={transferTarget}
        closeTransfer={closeTransfer}
        enrollmentsTarget={enrollmentsTarget}
        closeEnrollments={closeEnrollments}
        deleteUserTarget={deleteUserTarget}
        closeDeleteConfirm={closeDeleteConfirm}
        deletingUser={deletingUser}
        onDeleteConfirm={handleDeleteUserConfirm}
        staffState={staffState}
        coursesState={coursesState}
        usersState={usersState}
        fetchStats={fetchStats}
        setSuccessMsg={setSuccessMsg}
        t={t}
      />
    </div>
  );
};
