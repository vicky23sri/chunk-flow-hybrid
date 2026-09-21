import React from 'react';
import { Clock, CheckCircle2, Layers, HardDrive, RefreshCw, FileCheck, Calendar } from 'lucide-react';

export default function SchedulerMetrics({
  activeRulesCount,
  totalSchedulesCount,
  activeSelectedWorkflow,
  isLoadingMetrics,
  totalSnapshots,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Stat 1: Active Rules */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between hover:border-orange-300 transition-colors">
        <div>
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Active Backup Rules</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {activeRulesCount} <span className="text-xs font-semibold text-slate-400">/ {totalSchedulesCount} Rules</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 size={12} /> 100% Operational
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
          <Clock size={22} />
        </div>
      </div>

      {/* Stat 2: Active Target Canvas */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between hover:border-orange-300 transition-colors">
        <div>
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Active Canvas Target</div>
          <div className="text-xs font-black text-slate-900 mt-1.5 truncate max-w-[170px]" title={activeSelectedWorkflow?.name}>
            {activeSelectedWorkflow?.name || 'PostgreSQL -> S3 Pipeline'}
          </div>
          <div className="text-[10px] text-indigo-600 font-mono font-semibold mt-1 flex items-center gap-1">
            <Layers size={11} /> Wired Pipeline Node Graph
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-xs">
          <Layers size={22} />
        </div>
      </div>

      {/* Stat 3: Vault Snapshots */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between hover:border-orange-300 transition-colors">
        <div>
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Vault Snapshots</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {isLoadingMetrics ? <RefreshCw size={18} className="animate-spin text-slate-400" /> : totalSnapshots}
          </div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1 flex items-center gap-1">
            <FileCheck size={12} /> Verifiable History
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-xs">
          <HardDrive size={22} />
        </div>
      </div>

      {/* Stat 4: Next Window */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between hover:border-orange-300 transition-colors">
        <div>
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Next Cron Window</div>
          <div className="text-sm font-black text-[#f95716] font-mono mt-1">
            02:00:00 AM UTC
          </div>
          <div className="text-[11px] text-slate-500 font-normal mt-1">
            FastCDC 4.8x Chunking
          </div>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-orange-50 text-[#f95716] border border-orange-100 flex items-center justify-center shrink-0 shadow-xs">
          <Calendar size={22} />
        </div>
      </div>
    </div>
  );
}
