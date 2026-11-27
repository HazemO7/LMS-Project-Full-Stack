import React from 'react';
import { MagnifyingGlass, UserPlus } from '@phosphor-icons/react';
import { AdminUserRow } from './AdminUserRow';
import { AdminPaginationBar } from './AdminPaginationBar';

const UsersFilterBar = ({ filters, onOpenCreateStaff, t }) => (
  <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#99F6E4] bg-white p-4 shadow-xs lg:flex-row lg:items-center">
    <form onSubmit={filters.onSearchSubmit} className="flex flex-1 flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <MagnifyingGlass
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-[#52797A]"
        />
        <input
          type="text"
          value={filters.searchInput}
          onChange={(e) => filters.onSearchInputChange(e.target.value)}
          placeholder={t('admin.searchUsersPh')}
          className="w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/50 py-2 ps-9 pe-3 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:bg-white focus:outline-none"
        />
      </div>
      <select
        aria-label={t('admin.filterByRole')}
        value={filters.roleFilter}
        onChange={(e) => filters.onRoleFilterChange(e.target.value)}
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
        value={filters.statusFilter}
        onChange={(e) => filters.onStatusFilterChange(e.target.value)}
        className="rounded-lg border border-[#99F6E4] bg-white px-3 py-2 text-sm text-[#0D2E2F]"
      >
        <option value="all">{t('admin.allStatuses')}</option>
        <option value="active">{t('admin.statusActive')}</option>
        <option value="suspended">{t('admin.statusSuspended')}</option>
        <option value="locked">{t('admin.statusLocked')}</option>
      </select>
      <button type="submit" className="rounded-lg bg-[#0D9488] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F766E]">
        {t('courses.searchBtn')}
      </button>
    </form>

    <button
      type="button"
      onClick={onOpenCreateStaff}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0B3B3C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#114B4D]"
    >
      <UserPlus size={16} weight="bold" aria-hidden="true" className="text-[#F59E0B]" />
      {t('admin.addStaffBtn')}
    </button>
  </div>
);

const UsersTableBody = ({ users, nowMs, loading, currentUserId, isSuperAdmin, actions, t }) => {
  if (loading) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-[#52797A]">{t('common.loading')}</td>
      </tr>
    );
  }
  if (users.length === 0) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-[#52797A]">{t('admin.noUsersFound')}</td>
      </tr>
    );
  }
  return users.map((u) => (
    <AdminUserRow
      key={u._id}
      user={u}
      nowMs={nowMs}
      currentUserId={currentUserId}
      isSuperAdmin={isSuperAdmin}
      actions={actions}
      t={t}
    />
  ));
};

export const AdminUsersTab = ({
  users,
  nowMs,
  loading,
  page,
  totalPages,
  currentUserId,
  isSuperAdmin,
  onOpenCreateStaff,
  onPageChange,
  filters,
  actions,
  t,
}) => (
  <div className="space-y-4">
    <UsersFilterBar filters={filters} onOpenCreateStaff={onOpenCreateStaff} t={t} />

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
            <UsersTableBody
              users={users}
              nowMs={nowMs}
              loading={loading}
              currentUserId={currentUserId}
              isSuperAdmin={isSuperAdmin}
              actions={actions}
              t={t}
            />
          </tbody>
        </table>
      </div>
      <AdminPaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} t={t} />
    </div>
  </div>
);
