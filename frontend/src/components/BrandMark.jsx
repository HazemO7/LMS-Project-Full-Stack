import React from 'react';

export const BrandMark = ({ className = '', invert = false, showWordmark = true }) => (
  <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
    <svg
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="7" fill={invert ? '#FFFFFF' : '#0F172A'} />
      <rect x="7" y="7" width="18" height="4" rx="1" fill={invert ? '#0F172A' : '#FFFFFF'} />
      <rect x="7" y="14" width="12" height="4" rx="1" fill="#3B82F6" />
      <rect x="7" y="21" width="5" height="4" rx="1" fill="#1D4ED8" />
    </svg>
    {showWordmark && (
      <span
        className={`font-display text-lg font-bold tracking-tight ${
          invert ? 'text-white' : 'text-[#0F172A]'
        }`}
      >
        Foundry
      </span>
    )}
  </span>
);
