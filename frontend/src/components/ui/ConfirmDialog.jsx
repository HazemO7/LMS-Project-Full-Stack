import React from 'react';
import { Warning } from '@phosphor-icons/react';
import { useLanguage } from '../../context/LanguageContext';
import { Modal } from './Modal';

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  loading = false,
  danger = true,
}) => {
  const { t } = useLanguage();

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-md">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          {danger && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FEF2F2] text-[#DC2626]">
              <Warning size={20} weight="fill" aria-hidden="true" />
            </div>
          )}
          <p className="text-sm leading-relaxed text-[#335C5D]">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#CCFBF1] pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[#99F6E4] bg-white px-4 py-2 text-sm font-medium text-[#0D2E2F] transition-colors hover:bg-[#F0FDFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 ${
              danger
                ? 'bg-[#DC2626] hover:bg-[#B91C1C] focus-visible:ring-[#DC2626]'
                : 'bg-[#0D9488] hover:bg-[#0F766E] focus-visible:ring-[#0D9488]'
            }`}
          >
            {loading ? t('common.working') : confirmLabel || t('common.delete')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
