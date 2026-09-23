import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function OverviewBanner({ tenant }) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-xs relative overflow-hidden flex flex-wrap justify-between items-center gap-6">
      <div className="relative z-10 text-left max-w-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-bold bg-orange-50 text-[#f95716] border border-orange-200">
            PHYSICAL ISOLATION ACTIVE
          </span>
          <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 size={12} /> Dedicated PostgreSQL
          </span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {tenant?.name || 'Tenant Workspace Dashboard'}
        </h1>
      </div>
    </div>
  );
}
