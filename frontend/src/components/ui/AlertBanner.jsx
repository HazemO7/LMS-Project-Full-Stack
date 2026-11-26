import React from 'react';
import {
  CheckCircle,
  Info,
  Warning,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { useLanguage } from '../../context/LanguageContext';

const VARIANT_STYLES = {
  error: {
    container: 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]',
    iconColor: 'text-[#DC2626]',
    Icon: WarningCircle,
    role: 'alert',
  },
  success: {
    container: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]',
    iconColor: 'text-[#059669]',
    Icon: CheckCircle,
    role: 'status',
  },
  warning: {
    container: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
    iconColor: 'text-[#D97706]',
    Icon: Warning,
    role: 'alert',
  },
  info: {
    container: 'bg-[#CCFBF1] border-[#5EEAD4] text-[#115E59]',
    iconColor: 'text-[#0D9488]',
    Icon: Info,
    role: 'status',
  },
};

export const AlertBanner = ({
  variant = 'info',
  children,
  onDismiss,
  className = '',
}) => {
  const { t } = useLanguage();
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  const { Icon } = style;

  return (
    <div
      role={style.role}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed ${style.container} ${className}`}
    >
      <Icon
        size={18}
        weight="fill"
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${style.iconColor}`}
      />
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('common.dismiss')}
          className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
