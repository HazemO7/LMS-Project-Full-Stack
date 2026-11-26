import React, { useEffect, useRef } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import { useLanguage } from '../../context/LanguageContext';

export const FormErrorSummary = ({ errors = {}, fieldMap = {}, submitCount = 0 }) => {
  const { t } = useLanguage();
  const containerRef = useRef(null);

  const entries = Object.entries(errors).filter(([, err]) => err?.message);

  useEffect(() => {
    if (submitCount > 0 && entries.length > 0) {
      containerRef.current?.focus();
    }
  }, [submitCount, entries.length]);

  if (submitCount === 0 || entries.length === 0) return null;

  return (
    <div
      ref={containerRef}
      role="alert"
      tabIndex={-1}
      className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#991B1B] outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]"
    >
      <div className="flex items-start gap-2.5">
        <WarningCircle
          size={18}
          weight="fill"
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-[#DC2626]"
        />
        <div>
          <p className="font-semibold">{t('form.errorSummaryTitle')}</p>
          <ul className="mt-1.5 list-disc space-y-1 ps-5 text-xs">
            {entries.map(([field, err]) => {
              const targetId = fieldMap[field] || field;
              return (
                <li key={field}>
                  <a
                    href={`#${targetId}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(targetId)?.focus();
                    }}
                    className="underline hover:text-[#7F1D1D]"
                  >
                    {err.message}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};
