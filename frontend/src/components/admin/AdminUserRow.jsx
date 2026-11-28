import React from 'react';
import { LockOpen, PauseCircle, PlayCircle, Trash } from '@phosphor-icons/react';
import { getRoleBadgeClass } from '../../utils/roleUtils';

const RoleCell = ({ user, editable, isSuperAdmin, onRoleChange, mobile = false, t }) => {
  if (!editable) {
    return (
      <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${getRoleBadgeClass(user.role)}`}>
        {t(`role.${user.role}`)}
      </span>
    );
  }
  return (
    <select
      aria-label={t('admin.changeRoleAria', { name: user.name })}
      value={user.role}
      onChange={(e) => onRoleChange(user, e.target.value)}
      className={`rounded-lg border border-[#99F6E4] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/25 ${
        mobile ? 'min-h-[44px] w-full' : 'min-h-[36px]'
      }`}
    >
      <option value="student">{t('role.student')}</option>
      <option value="instructor">{t('role.instructor')}</option>
      {isSuperAdmin && <option value="admin">{t('role.admin')}</option>}
      {isSuperAdmin && <option value="super_admin">{t('role.super_admin')}</option>}
    </select>
  );
};

const StatusCell = ({ suspended, isLocked, mustChangePassword, t }) => {
  const statusTone = suspended
    ? 'bg-[#FEF2F2] text-[#991B1B] ring-[#FECACA]'
    : 'bg-[#D1FAE5] text-[#065F46] ring-[#A7F3D0]';
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${statusTone}`}>
        {suspended ? t('admin.statusSuspended') : t('admin.statusActive')}
      </span>
      {isLocked && (
        <span className="rounded-md bg-[#FEF3C7] px-2 py-0.5 text-xs font-semibold text-[#92400E] ring-1 ring-[#FDE68A]">
          {t('admin.statusLocked')}
        </span>
      )}
      {mustChangePassword && (
        <span className="rounded-md bg-[#E0F2FE] px-2 py-0.5 text-[11px] font-semibold text-[#0369A1]">
          {t('admin.tempPwBadge')}
        </span>
      )}
    </div>
  );
};

const ActionIconButton = ({ visible, onClick, title, mobile = false, className, children }) => {
  if (!visible) return null;
  const sizeClass = mobile ? 'min-h-[44px] min-w-[44px] p-2.5' : 'min-h-[36px] min-w-[36px] p-2';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${sizeClass} ${className}`}
    >
      {children}
    </button>
  );
};

const getToggleButtonProps = (suspended, t) => ({
  title: suspended ? t('admin.activateAccount') : t('admin.suspendAccount'),
  className: suspended
    ? 'border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46] hover:bg-[#A7F3D0]'
    : 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2]',
  icon: suspended ? <PlayCircle size={16} aria-hidden="true" /> : <PauseCircle size={16} aria-hidden="true" />,
});

const UserActionButtons = ({ user, flags, actions, mobile = false, t }) => {
  const { editable, isSelf, isSuperAdmin, isLocked, suspended } = flags;
  const toggleProps = getToggleButtonProps(suspended, t);
  return (
    <div className="inline-flex items-center gap-2">
      <ActionIconButton
        visible={editable && isLocked}
        onClick={() => actions.onUnlockUser(user)}
        title={t('admin.unlockAccount')}
        mobile={mobile}
        className="border-[#FDE68A] bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]"
      >
        <LockOpen size={16} aria-hidden="true" />
      </ActionIconButton>
      <ActionIconButton
        visible={editable && !isSelf}
        onClick={() => actions.onToggleStatus(user)}
        title={toggleProps.title}
        mobile={mobile}
        className={toggleProps.className}
      >
        {toggleProps.icon}
      </ActionIconButton>
      <ActionIconButton
        visible={isSuperAdmin && !isSelf}
        onClick={() => actions.onDeleteUser(user)}
        title={t('admin.deleteUserTitle')}
        mobile={mobile}
        className="border-[#FECACA] bg-white text-[#DC2626] hover:bg-[#FEF2F2]"
      >
        <Trash size={16} aria-hidden="true" />
      </ActionIconButton>
    </div>
  );
};

const deriveUserRowFlags = (user, nowMs, currentUserId, isSuperAdmin) => {
  const isPrivilegedTarget = user.role === 'admin' || user.role === 'super_admin';
  return {
    editable: isSuperAdmin || !isPrivilegedTarget,
    isSelf: user._id === currentUserId,
    isSuperAdmin,
    isLocked: Boolean(user.lockUntil && new Date(user.lockUntil).getTime() > nowMs),
    suspended: user.isActive === false,
  };
};

export const AdminUserRow = ({ user, nowMs, currentUserId, isSuperAdmin, actions, t }) => {
  const flags = deriveUserRowFlags(user, nowMs, currentUserId, isSuperAdmin);

  return (
    <tr className="hover:bg-[#F0FDFA]/50">
      <td className="px-4 py-3 text-start">
        <p className="font-semibold text-[#0D2E2F]">{user.name}</p>
        <p className="text-xs text-[#4A6F70]">
          <bdi dir="ltr">{user.email}</bdi>
        </p>
        {user.specialty && <p className="mt-0.5 text-xs text-[#0F766E]">{user.specialty}</p>}
      </td>
      <td className="px-4 py-3">
        <RoleCell
          user={user}
          editable={flags.editable}
          isSuperAdmin={isSuperAdmin}
          onRoleChange={actions.onRoleChange}
          t={t}
        />
      </td>
      <td className="px-4 py-3">
        <StatusCell
          suspended={flags.suspended}
          isLocked={flags.isLocked}
          mustChangePassword={user.mustChangePassword}
          t={t}
        />
      </td>
      <td className="px-4 py-3 text-end">
        <UserActionButtons user={user} flags={flags} actions={actions} t={t} />
      </td>
    </tr>
  );
};

export const AdminUserCard = ({ user, nowMs, currentUserId, isSuperAdmin, actions, t }) => {
  const flags = deriveUserRowFlags(user, nowMs, currentUserId, isSuperAdmin);

  return (
    <li className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 text-start">
          <p className="font-semibold text-[#0D2E2F]">{user.name}</p>
          <p className="truncate text-xs text-[#4A6F70]">
            <bdi dir="ltr">{user.email}</bdi>
          </p>
          {user.specialty && <p className="mt-0.5 text-xs text-[#0F766E]">{user.specialty}</p>}
        </div>
        <StatusCell
          suspended={flags.suspended}
          isLocked={flags.isLocked}
          mustChangePassword={user.mustChangePassword}
          t={t}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="min-w-[140px] flex-1">
          <RoleCell
            user={user}
            editable={flags.editable}
            isSuperAdmin={isSuperAdmin}
            onRoleChange={actions.onRoleChange}
            mobile
            t={t}
          />
        </div>
        <UserActionButtons user={user} flags={flags} actions={actions} mobile t={t} />
      </div>
    </li>
  );
};
