import React from 'react';
import { CheckCircle, Circle } from '@phosphor-icons/react';
import { useLanguage } from '../../context/LanguageContext';
import { getPasswordChecks } from '../../utils/passwordRules';

export const PasswordStrengthMeter = ({ password = '', showChecklist = true }) => {
  const { t } = useLanguage();
  const checks = getPasswordChecks(password, t);
  const score = checks.filter((c) => c.check).length;

  const getStrengthMeta = () => {
    if (score <= 2) return { color: 'bg-[#DC2626]', text: 'text-[#DC2626]', label: t('pw.weak') };
    if (score === 3) return { color: 'bg-[#D97706]', text: 'text-[#B45309]', label: t('pw.fair') };
    if (score === 4) return { color: 'bg-[#0D9488]', text: 'text-[#0F766E]', label: t('pw.good') };
    return { color: 'bg-[#059669]', text: 'text-[#059669]', label: t('pw.strong') };
  };

  const strength = getStrengthMeta();

  return (
    <div className="space-y-3">
      {password.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
            <span className="text-[#335C5D]">{t('pw.strength')}</span>
            <span aria-live="polite" className={strength.text}>
              {strength.label}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-colors ${
                  step <= score ? strength.color : 'bg-[#CCFBF1]'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {showChecklist && (
        <div className="rounded-lg border border-[#99F6E4] bg-[#F0FDFA] p-3">
          <p className="mb-2 text-xs font-semibold text-[#0D2E2F]">
            {t('pw.reqsTitle')}
          </p>
          <ul className="space-y-1.5">
            {checks.map(({ key, check, label }) => (
              <li key={key} className="flex items-center gap-2 text-xs">
                {check ? (
                  <CheckCircle
                    size={15}
                    weight="fill"
                    aria-hidden="true"
                    className="shrink-0 text-[#059669]"
                  />
                ) : (
                  <Circle
                    size={15}
                    aria-hidden="true"
                    className="shrink-0 text-[#5EEAD4]"
                  />
                )}
                <span className={check ? 'font-medium text-[#065F46]' : 'text-[#335C5D]'}>
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
