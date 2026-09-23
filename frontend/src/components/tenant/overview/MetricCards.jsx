import React from 'react';
import { Projector, Plug, Database, HardDrive } from 'lucide-react';

export default function MetricCards({ snapshotCount, connectorsCount, cdcSnapshotsCount, totalChunkSize }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
      
      <div className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors rounded-l-2xl">
        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#f95716] flex items-center justify-center shrink-0">
          <Projector size={18} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Active Workflows</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 leading-none">{snapshotCount}</span>
            <span className="text-[10px] font-bold text-emerald-500">Live</span>
          </div>
        </div>
      </div>

      <div className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Plug size={18} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Connectors</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 leading-none">{connectorsCount}</span>
          </div>
        </div>
      </div>

      <div className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Database size={18} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Snapshots</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 leading-none">{cdcSnapshotsCount}</span>
          </div>
        </div>
      </div>

      <div className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors rounded-r-2xl">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <HardDrive size={18} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Storage Used</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900 leading-none">{totalChunkSize}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
