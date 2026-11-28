import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, Info, Warning, WarningCircle, X } from '@phosphor-icons/react';
import { ToastContext } from './ToastContext';
import { useLanguage } from './LanguageContext';

const VARIANT_STYLES = {
  success: {
    container: 'border-[#A7F3D0] bg-white text-[#065F46]',
    icon: CheckCircle,
    iconClass: 'text-[#059669]',
  },
  error: {
    container: 'border-[#FECACA] bg-white text-[#991B1B]',
    icon: WarningCircle,
    iconClass: 'text-[#DC2626]',
  },
  warning: {
    container: 'border-[#FDE68A] bg-white text-[#92400E]',
    icon: Warning,
    iconClass: 'text-[#D97706]',
  },
  info: {
    container: 'border-[#99F6E4] bg-white text-[#0F766E]',
    icon: Info,
    iconClass: 'text-[#0D9488]',
  },
};

export const ToastProvider = ({ children }) => {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToast = useCallback(
    (message, variant = 'info') => {
      if (!message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = variant === 'error' ? 5500 : 4000;

      setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);

      const timer = window.setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, duration);
      timersRef.current.set(id, timer);
    },
    []
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 end-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info;
          const VariantIcon = style.icon;
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border p-3.5 text-sm shadow-lg ${style.container}`}
            >
              <VariantIcon
                size={18}
                weight="fill"
                aria-hidden="true"
                className={`mt-0.5 shrink-0 ${style.iconClass}`}
              />
              <p className="min-w-0 flex-1 text-xs font-medium leading-relaxed sm:text-sm">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label={t('common.dismiss')}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#4A6F70] transition-colors hover:bg-[#F0FDFA] hover:text-[#0D2E2F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
