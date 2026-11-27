import React from 'react';
import { AdminPaginationBar } from './AdminPaginationBar';
import { AUDIT_ACTIONS } from './adminConstants';

const AdminAuditRow = ({ log, isExpanded, onToggleDetails, t }) => {
  const panelId = `audit-details-${log._id}`;
  const metadataCompact = JSON.stringify(log.metadata || {});
  return (
    <tr className="hover:bg-[#F0FDFA]/50">
      <td dir="ltr" className="whitespace-nowrap px-4 py-2.5 align-top font-mono-tabular text-[#52797A]">
        {new Date(log.createdAt).toLocaleString()}
      </td>
      <td className="px-4 py-2.5 align-top">
        <span className="font-semibold text-[#0D2E2F]">{log.actor?.name || t('admin.deletedActor')}</span>
        {log.actor?.email && (
          <span dir="ltr" className="block text-[11px] text-[#52797A]">{log.actor.email}</span>
        )}
      </td>
      <td className="px-4 py-2.5 align-top">
        <span className="rounded bg-[#CCFBF1] px-2 py-0.5 font-mono-tabular font-semibold text-[#0F766E]">
          {log.action}
        </span>
      </td>
      <td className="px-4 py-2.5 align-top font-mono-tabular text-[#335C5D]">
        <div className="flex items-center gap-2">
          <span dir="ltr" className="max-w-xs truncate">{metadataCompact}</span>
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={panelId}
            aria-label={t('admin.toggleDetailsAria', { action: log.action })}
            onClick={() => onToggleDetails(log._id)}
            className="shrink-0 rounded border border-[#99F6E4] bg-white px-2 py-0.5 font-sans text-[11px] font-semibold text-[#0F766E] hover:bg-[#F0FDFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            {isExpanded ? t('admin.hideDetails') : t('admin.viewDetails')}
          </button>
        </div>
        {isExpanded && (
          <pre
            id={panelId}
            dir="ltr"
            className="mt-2 max-w-md overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-[#CCFBF1] bg-[#F0FDFA] p-2.5 text-[11px] text-[#0D2E2F]"
          >
            {JSON.stringify(log.metadata || {}, null, 2)}
          </pre>
        )}
      </td>
    </tr>
  );
};

const AuditTableBody = ({ loading, logs, expandedIds, onToggleDetails, t }) => {
  if (loading) {
    return <tr><td colSpan={4} className="px-4 py-8 text-center text-[#52797A]">{t('common.loading')}</td></tr>;
  }
  if (logs.length === 0) {
    return <tr><td colSpan={4} className="px-4 py-8 text-center text-[#52797A]">{t('admin.noAuditLogs')}</td></tr>;
  }
  return logs.map((log) => (
    <AdminAuditRow
      key={log._id}
      log={log}
      isExpanded={expandedIds.has(log._id)}
      onToggleDetails={onToggleDetails}
      t={t}
    />
  ));
};

export const AdminAuditLogsTab = ({
  logs, loading, page, totalPages, actionFilter, expandedIds, onActionFilterChange, onPageChange, onToggleDetails, t,
}) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#99F6E4] bg-white p-4 shadow-xs">
      <p className="text-sm font-semibold text-[#0D2E2F]">{t('admin.auditDesc')}</p>
      <select
        aria-label={t('admin.filterByAction')}
        value={actionFilter}
        onChange={(e) => onActionFilterChange(e.target.value)}
        className="rounded-lg border border-[#99F6E4] bg-white px-3 py-1.5 text-xs font-semibold text-[#0D2E2F]"
      >
        <option value="all">{t('admin.allActions')}</option>
        {AUDIT_ACTIONS.map((action) => (
          <option key={action} value={action}>{action}</option>
        ))}
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
            <AuditTableBody
              loading={loading}
              logs={logs}
              expandedIds={expandedIds}
              onToggleDetails={onToggleDetails}
              t={t}
            />
          </tbody>
        </table>
      </div>
      <AdminPaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} t={t} />
    </div>
  </div>
);
