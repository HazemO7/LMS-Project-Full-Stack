import React from 'react';
import { CheckCircle, Circle } from '@phosphor-icons/react';
import { getPasswordChecks } from '../../utils/passwordRules';

export const PasswordStrengthMeter = ({ password = '', showChecklist = true }) => {
  const checks = getPasswordChecks(password);
  const score = checks.filter((c) => c.check).length;

  const getStrengthMeta = () => {
    if (score <= 2) return { color: 'bg-[#DC2626]', text: 'text-[#DC2626]', label: 'Weak' };
    if (score === 3) return { color: 'bg-[#D97706]', text: 'text-[#B45309]', label: 'Fair' };
    if (score === 4) return { color: 'bg-[#2563EB]', text: 'text-[#1D4ED8]', label: 'Good' };
    return { color: 'bg-[#059669]', text: 'text-[#059669]', label: 'Strong' };
  };

  const strength = getStrengthMeta();

  return (
    <div className="space-y-3">
      {password.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
            <span className="text-[#475569]">Password strength</span>
            <span className={strength.text}>{strength.label}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-colors ${
                  step <= score ? strength.color : 'bg-[#E2E8F0]'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {showChecklist && (
        <div className="rounded-lg border border-[#E2E8F0] bg-[#F7F8FA] p-3">
          <p className="mb-2 text-xs font-semibold text-[#0F172A]">
            Password requirements
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
                    className="shrink-0 text-[#94A3B8]"
                  />
                )}
                <span className={check ? 'font-medium text-[#065F46]' : 'text-[#475569]'}>
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
