import React from 'react';
import { AdminPaginationBar } from './AdminPaginationBar';
import { AUDIT_ACTIONS } from './adminConstants';

const MetadataChips = ({ metadata }) => {
  const entries = Object.entries(metadata || {}).slice(0, 3);
  if (entries.length === 0) return <span className="text-xs text-[#4A6F70]">—</span>;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {entries.map(([key, val]) => (
        <span
          key={key}
          className="inline-flex max-w-[200px] truncate rounded bg-[#F0FDFA] px-2 py-0.5 font-mono-tabular text-[11px] text-[#335C5D] ring-1 ring-[#CCFBF1]"
        >
          <bdi dir="ltr">{`${key}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`}</bdi>
        </span>
      ))}
    </div>
  );
};

const AdminAuditRow = ({ log, isExpanded, onToggleDetails, t }) => {
  const panelId = `audit-details-${log._id}`;
  return (
    <tr className="hover:bg-[#F0FDFA]/50">
      <td className="whitespace-nowrap px-4 py-3 align-top font-mono-tabular text-[#4A6F70]">
        <bdi dir="ltr">{new Date(log.createdAt).toLocaleString()}</bdi>
      </td>
      <td className="px-4 py-3 align-top text-start">
        <span className="font-semibold text-[#0D2E2F]">{log.actor?.name || t('admin.deletedActor')}</span>
        {log.actor?.email && (
          <span className="block text-[11px] text-[#4A6F70]">
            <bdi dir="ltr">{log.actor.email}</bdi>
          </span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <span className="rounded bg-[#CCFBF1] px-2 py-0.5 font-mono-tabular font-semibold text-[#0F766E]">
          {log.action}
        </span>
      </td>
      <td className="px-4 py-3 align-top text-[#335C5D]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <MetadataChips metadata={log.metadata} />
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={panelId}
            aria-label={t('admin.toggleDetailsAria', { action: log.action })}
            onClick={() => onToggleDetails(log._id)}
            className="inline-flex min-h-[36px] shrink-0 items-center rounded-lg border border-[#99F6E4] bg-white px-3 py-1.5 font-sans text-xs font-semibold text-[#0F766E] hover:bg-[#F0FDFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
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

const AdminAuditCard = ({ log, isExpanded, onToggleDetails, t }) => {
  const panelId = `audit-mobile-details-${log._id}`;
  return (
    <li className="space-y-2.5 p-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded bg-[#CCFBF1] px-2 py-0.5 font-mono-tabular font-semibold text-[#0F766E]">
          {log.action}
        </span>
        <span className="font-mono-tabular text-[11px] text-[#4A6F70]">
          <bdi dir="ltr">{new Date(log.createdAt).toLocaleString()}</bdi>
        </span>
      </div>
      <div className="text-start">
        <p className="font-semibold text-[#0D2E2F]">{log.actor?.name || t('admin.deletedActor')}</p>
        {log.actor?.email && (
          <p className="text-[11px] text-[#4A6F70]">
            <bdi dir="ltr">{log.actor.email}</bdi>
          </p>
        )}
      </div>
      <MetadataChips metadata={log.metadata} />
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        aria-label={t('admin.toggleDetailsAria', { action: log.action })}
        onClick={() => onToggleDetails(log._id)}
        className="inline-flex min-h-[40px] items-center rounded-lg border border-[#99F6E4] bg-white px-3 py-1.5 font-sans text-xs font-semibold text-[#0F766E] hover:bg-[#F0FDFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
      >
        {isExpanded ? t('admin.hideDetails') : t('admin.viewDetails')}
      </button>
      {isExpanded && (
        <pre
          id={panelId}
          dir="ltr"
          className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-[#CCFBF1] bg-[#F0FDFA] p-2.5 text-[11px] text-[#0D2E2F]"
        >
          {JSON.stringify(log.metadata || {}, null, 2)}
        </pre>
      )}
    </li>
  );
};

const AuditTableSkeleton = () =>
  [1, 2, 3, 4, 5].map((i) => (
    <tr key={i} className="animate-pulse">
      <td className="px-4 py-3.5"><div className="h-3.5 w-32 rounded bg-[#CCFBF1]" /></td>
      <td className="px-4 py-3.5">
        <div className="h-4 w-24 rounded bg-[#CCFBF1]" />
        <div className="mt-1 h-3 w-32 rounded bg-[#E6F7F5]" />
      </td>
      <td className="px-4 py-3.5"><div className="h-5 w-28 rounded bg-[#CCFBF1]" /></td>
      <td className="px-4 py-3.5"><div className="h-7 w-40 rounded bg-[#CCFBF1]" /></td>
    </tr>
  ));

const AuditTableBody = ({ loading, logs, expandedIds, onToggleDetails, t }) => {
  if (loading) return <AuditTableSkeleton />;
  if (logs.length === 0) {
    return <tr><td colSpan={4} className="px-4 py-8 text-center text-[#4A6F70]">{t('admin.noAuditLogs')}</td></tr>;
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
        className="min-h-[44px] rounded-lg border border-[#99F6E4] bg-white px-3 py-2 text-xs font-semibold text-[#0D2E2F] focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/25"
      >
        <option value="all">{t('admin.allActions')}</option>
        {AUDIT_ACTIONS.map((action) => (
          <option key={action} value={action}>{action}</option>
        ))}
      </select>
    </div>
    <div className="overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xs">
      <div className="hidden overflow-x-auto md:block">
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

      {loading ? (
        <ul role="status" aria-busy="true" aria-label={t('common.loading')} className="divide-y divide-[#CCFBF1] md:hidden">
          {[1, 2, 3].map((i) => (
            <li key={i} className="animate-pulse space-y-2.5 p-4">
              <div className="h-4 w-28 rounded bg-[#CCFBF1]" />
              <div className="h-3.5 w-40 rounded bg-[#E6F7F5]" />
              <div className="h-8 w-24 rounded-lg bg-[#CCFBF1]" />
            </li>
          ))}
        </ul>
      ) : logs.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-[#4A6F70] md:hidden">{t('admin.noAuditLogs')}</p>
      ) : (
        <ul className="divide-y divide-[#CCFBF1] md:hidden">
          {logs.map((log) => (
            <AdminAuditCard
              key={log._id}
              log={log}
              isExpanded={expandedIds.has(log._id)}
              onToggleDetails={onToggleDetails}
              t={t}
            />
          ))}
        </ul>
      )}

      <AdminPaginationBar page={page} totalPages={totalPages} onPageChange={onPageChange} t={t} />
    </div>
  </div>
);
