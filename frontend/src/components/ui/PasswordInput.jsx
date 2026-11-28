import React, { useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';

/**
 * Accessible LTR password input with RTL-safe placeholder alignment,
 * 44px minimum touch target height, and aria-describedby error linkage.
 */
export const PasswordInput = ({
  id,
  label,
  labelExtra = null,
  autoComplete,
  placeholder,
  disabled = false,
  error,
  registration,
  showLabel,
  hideLabel,
}) => {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium text-[#0D2E2F]">
          {label}
        </label>
        {labelExtra}
      </div>

      <div className="relative" dir="ltr">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...registration}
          className={`min-h-[44px] w-full rounded-lg border py-2.5 pl-3.5 pr-12 text-left text-sm text-[#0D2E2F] placeholder:text-[#4A6F70]/75 rtl:placeholder:text-right focus:outline-none focus:ring-2 ${
            error
              ? 'border-[#DC2626] bg-[#FEF2F2]/30 focus:border-[#DC2626] focus:ring-[#DC2626]/20'
              : 'border-[#99F6E4] bg-[#F0FDFA]/40 focus:border-[#0D9488] focus:bg-white focus:ring-[#0D9488]/20'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-e-lg text-[#335C5D] transition-colors hover:text-[#0B3B3C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0D9488]"
        >
          {visible ? <EyeSlash size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>

      {error?.message && (
        <p id={errorId} className="mt-1 text-xs font-medium text-[#DC2626]">
          {error.message}
        </p>
      )}
    </div>
  );
};
