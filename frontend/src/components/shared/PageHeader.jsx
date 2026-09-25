import React from 'react';

/**
 * Reusable PageHeader component — consistent across all pages.
 *
 * Props:
 *  - icon        : Lucide icon component (e.g. Database, Zap)
 *  - title       : string — main heading
 *  - description : string — subtitle text
 *  - actions     : ReactNode — buttons on the right side
 */
export default function PageHeader({ icon: Icon, title, description, actions, className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-3xl shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden ${className}`}>
      <div className="absolute -right-16 -top-16 w-56 h-56 bg-orange-100 rounded-full opacity-30 blur-3xl pointer-events-none" />
      <div className="flex items-center gap-3.5 relative">
        {Icon && (
          <div className="w-11 h-11 rounded-2xl bg-[#f95716] flex items-center justify-center shadow-lg shadow-orange-400/30 shrink-0">
            <Icon size={20} className="text-white" />
          </div>
        )}
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 relative shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
