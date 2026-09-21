import React from 'react';
import { ShieldCheck, Activity, Terminal } from 'lucide-react';

export default function SchedulerHeader({ showTerminal, setShowTerminal }) {
  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> FastCDC Engine Active
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck size={12} className="text-purple-600" /> AES-256 Encrypted
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Activity size={12} className="text-blue-600" /> 100% Health
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Automated Cron Engine & Backup Scheduler
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-normal max-w-2xl leading-relaxed">
          Target pipeline canvas workflows to run automated snapshot intervals, retention policies, and deduplicated backup execution rules.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setShowTerminal(!showTerminal)}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-2 border shadow-xs ${
            showTerminal
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
          }`}
        >
          <Terminal size={14} className={showTerminal ? 'text-emerald-400' : 'text-slate-500'} />
          <span>{showTerminal ? 'Hide Terminal Logs' : 'Execution Logs'}</span>
        </button>
      </div>
    </div>
  );
}
