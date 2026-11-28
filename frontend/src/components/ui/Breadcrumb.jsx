import React from 'react';
import { Link } from 'react-router-dom';
import { CaretRight } from '@phosphor-icons/react';

/**
 * Accessible hierarchical breadcrumb bar with RTL-mirrored separators and <bdi> isolation.
 */
export const Breadcrumb = ({ items = [], ariaLabel, invert = false, className = '' }) => {
  if (!items.length) return null;

  const linkClass = invert
    ? 'text-[#99F6E4] hover:text-[#FBBF24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] rounded'
    : 'text-[#0F766E] hover:text-[#D97706] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] rounded';
  const currentClass = invert ? 'text-[#CCFBF1]/85 font-semibold' : 'text-[#335C5D] font-semibold';
  const sepClass = invert ? 'text-[#5EEAD4]/60' : 'text-[#4A6F70]/60';

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="inline-flex items-center gap-1.5">
              {idx > 0 && (
                <CaretRight
                  size={12}
                  weight="bold"
                  aria-hidden="true"
                  className={`shrink-0 rtl:rotate-180 ${sepClass}`}
                />
              )}
              {isLast || !item.to ? (
                <span aria-current={isLast ? 'page' : undefined} className={currentClass}>
                  <bdi>{item.label}</bdi>
                </span>
              ) : (
                <Link to={item.to} className={`py-0.5 transition-colors ${linkClass}`}>
                  <bdi>{item.label}</bdi>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
