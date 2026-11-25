import React from 'react';
import { Modal } from './Modal';
import { Warning } from '@phosphor-icons/react';

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
  danger = true,
}) => {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-md">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          {danger && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FEF2F2] text-[#DC2626]">
              <Warning size={20} weight="fill" aria-hidden="true" />
            </div>
          )}
          <p className="text-sm leading-relaxed text-[#475569]">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F7F8FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 ${
              danger
                ? 'bg-[#DC2626] hover:bg-[#B91C1C] focus-visible:ring-[#DC2626]'
                : 'bg-[#1D4ED8] hover:bg-[#1E40AF] focus-visible:ring-[#1D4ED8]'
            }`}
          >
            {loading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
