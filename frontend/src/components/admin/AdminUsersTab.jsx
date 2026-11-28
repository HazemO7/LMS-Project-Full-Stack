import React from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { AdminUserCard, AdminUserRow } from './AdminUserRow';
import { AdminPaginationBar } from './AdminPaginationBar';

const STATUS_LABEL_KEY = {
  active: 'admin.statusActive',
  suspended: 'admin.statusSuspended',
  locked: 'admin.statusLocked',
};

const ActiveUserFilterChips = ({ filters, t }) => {
  const chips = [];
  if (filters.activeSearch) {
    chips.push({ key: 'search', label: t('common.activeSearch', { query: filters.activeSearch }), onClear: filters.onClearSearch });
  }
  if (filters.roleFilter !== 'all') {
    chips.push({ key: 'role', label: t(`role.${filters.roleFilter}`), onClear: () => filters.onRoleFilterChange('all') });
  }
  if (filters.statusFilter !== 'all') {
    const statusKey = STATUS_LABEL_KEY[filters.statusFilter] || 'admin.statusActive';
    chips.push({ key: 'status', label: t(statusKey), onClear: () => filters.onStatusFilterChange('all') });
  }
  if (chips.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#CCFBF1] pt-3">
      <span className="text-xs font-medium text-[#4A6F70]">{t('admin.activeFiltersLabel')}</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onClear}
          className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full border border-[#99F6E4] bg-[#F0FDFA] px-3 py-1 text-xs font-semibold text-[#0F766E] hover:bg-[#CCFBF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
        >
          <span>{chip.label}</span>
          <X size={12} weight="bold" aria-hidden="true" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={filters.onClearAll}
          className="min-h-[32px] px-2 text-xs font-semibold text-[#4A6F70] underline hover:text-[#0D2E2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
        >
          {t('common.clearFilters')}
        </button>
      )}
    </div>
  );
};

const UsersFilterBar = ({ filters, t }) => (
  <div className="rounded-xl border border-[#99F6E4] bg-white p-4 shadow-xs">
    <form onSubmit={filters.onSearchSubmit} className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[220px] flex-1">
        <MagnifyingGlass
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-[#4A6F70]"
        />
        <input
          type="text"
          aria-label={t('admin.searchUsersAria')}
          value={filters.searchInput}
          onChange={(e) => filters.onSearchInputChange(e.target.value)}
          placeholder={t('admin.searchUsersPh')}
          className="min-h-[44px] w-full rounded-lg border border-[#99F6E4] bg-[#F0FDFA]/50 py-2.5 ps-9 pe-3 text-sm text-[#0D2E2F] placeholder:text-[#4A6F70]/75 focus:border-[#0D9488] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/25"
        />
      </div>
      <select
        aria-label={t('admin.filterByRole')}
        value={filters.roleFilter}
        onChange={(e) => filters.onRoleFilterChange(e.target.value)}
        className="min-h-[44px] rounded-lg border border-[#99F6E4] bg-white px-3 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/25"
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
        className="min-h-[44px] rounded-lg border border-[#99F6E4] bg-white px-3 py-2 text-sm text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/25"
      >
        <option value="all">{t('admin.allStatuses')}</option>
        <option value="active">{t('admin.statusActive')}</option>
        <option value="suspended">{t('admin.statusSuspended')}</option>
        <option value="locked">{t('admin.statusLocked')}</option>
      </select>
      <button
        type="submit"
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#115E59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
      >
        {t('courses.searchBtn')}
      </button>
    </form>
    <ActiveUserFilterChips filters={filters} t={t} />
  </div>
);

const UsersTableSkeleton = ({ t }) =>
  [1, 2, 3, 4, 5].map((i) => (
    <tr key={i} aria-label={i === 1 ? t('common.loading') : undefined} className="animate-pulse">
      <td className="px-4 py-3.5">
        <div className="h-4 w-32 rounded bg-[#CCFBF1]" />
        <div className="mt-1.5 h-3 w-44 rounded bg-[#E6F7F5]" />
      </td>
      <td className="px-4 py-3.5"><div className="h-8 w-24 rounded-lg bg-[#CCFBF1]" /></td>
      <td className="px-4 py-3.5"><div className="h-6 w-16 rounded bg-[#CCFBF1]" /></td>
      <td className="px-4 py-3.5 text-end"><div className="ms-auto h-8 w-20 rounded-lg bg-[#CCFBF1]" /></td>
    </tr>
  ));

const UsersTableBody = ({ users, nowMs, loading, currentUserId, isSuperAdmin, actions, t }) => {
  if (loading) return <UsersTableSkeleton t={t} />;
  if (users.length === 0) {
    return (
      <tr>
        <td colSpan={4} className="px-4 py-8 text-center text-[#4A6F70]">{t('admin.noUsersFound')}</td>
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

const UsersMobileList = ({ users, nowMs, loading, currentUserId, isSuperAdmin, actions, t }) => {
  if (loading) {
    return (
      <ul role="status" aria-busy="true" aria-label={t('common.loading')} className="divide-y divide-[#CCFBF1] md:hidden">
        {[1, 2, 3].map((i) => (
          <li key={i} className="animate-pulse space-y-3 p-4">
            <div className="h-4 w-36 rounded bg-[#CCFBF1]" />
            <div className="h-3 w-48 rounded bg-[#E6F7F5]" />
            <div className="h-10 w-full rounded-lg bg-[#CCFBF1]" />
          </li>
        ))}
      </ul>
    );
  }
  if (users.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-[#4A6F70] md:hidden">{t('admin.noUsersFound')}</p>;
  }
  return (
    <ul className="divide-y divide-[#CCFBF1] md:hidden">
      {users.map((u) => (
        <AdminUserCard
          key={u._id}
          user={u}
          nowMs={nowMs}
          currentUserId={currentUserId}
          isSuperAdmin={isSuperAdmin}
          actions={actions}
          t={t}
        />
      ))}
    </ul>
  );
};

export const AdminUsersTab = ({
  users,
  nowMs,
  loading,
  page,
  totalPages,
  currentUserId,
  isSuperAdmin,
  onPageChange,
  filters,
  actions,
  t,
}) => (
  <div className="space-y-4">
    <UsersFilterBar filters={filters} t={t} />

    <div className="overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xs">
      <div className="hidden overflow-x-auto md:block" aria-busy={loading}>
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

      <UsersMobileList
        users={users}
        nowMs={nowMs}
        loading={loading}
        currentUserId={currentUserId}
        isSuperAdmin={isSuperAdmin}
        actions={actions}
        t={t}
      />

      <AdminPaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} t={t} />
    </div>
  </div>
);
