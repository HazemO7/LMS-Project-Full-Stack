import React, { useEffect, useId, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import { useLanguage } from '../../context/LanguageContext';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  maxWidthClass = 'max-w-lg',
}) => {
  const { t } = useLanguage();
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        panel.focus();
      }
    }, 0);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
        );
        if (focusable.length === 0) {
          e.preventDefault();
          panelRef.current.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            document.activeElement === panelRef.current
          ) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B3B3C]/65 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`flex max-h-[calc(100vh-2rem)] w-full flex-col ${maxWidthClass} overflow-hidden rounded-xl border border-[#99F6E4] bg-white shadow-xl outline-none`}
      >
        <div className="h-1 shrink-0 w-full bg-gradient-to-r from-[#0D9488] to-[#F59E0B]" />
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#CCFBF1] bg-[#F0FDFA] px-6 py-4">
          <div>
            <h2
              id={titleId}
              className="font-display text-lg font-semibold text-[#0D2E2F]"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-[#335C5D]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.closeModal')}
            className="rounded-lg p-1.5 text-[#335C5D] transition-colors hover:bg-[#CCFBF1] hover:text-[#0D2E2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};
