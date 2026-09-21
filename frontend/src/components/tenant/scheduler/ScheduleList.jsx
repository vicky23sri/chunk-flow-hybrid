import React from 'react';
import { 
  Calendar, CheckCircle2, Layers, RefreshCw, Play, Power, Trash2 
} from 'lucide-react';

export default function ScheduleList({
  schedules,
  activeRulesCount,
  runningScheduleId,
  handleRunScheduleNow,
  handleToggleSchedule,
  handleDeleteSchedule
}) {
  return (
    <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-xs">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Configured Backup Schedules
              </h3>
              <p className="text-[11px] text-slate-400">
                Active cron rules & target pipeline executions
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {activeRulesCount} Active
          </span>
        </div>

        {/* List Cards */}
        {schedules.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
            No backup schedules registered yet.
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((sched) => (
              <div
                key={sched.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  sched.enabled
                    ? 'bg-slate-50/90 border-slate-200/90 hover:border-orange-300'
                    : 'bg-slate-50/40 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {sched.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      {sched.cronExp}
                    </span>
                    {sched.enabled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={10} /> ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-600">
                        PAUSED
                      </span>
                    )}
                  </div>

                  {/* Target Canvas Pipeline Badge */}
                  <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 w-fit shadow-2xs">
                    <Layers size={12} className="text-[#f95716]" />
                    <span>Target Canvas: <strong className="text-slate-900 font-bold">{sched.targetCanvasName || 'PostgreSQL -> S3 Vault Data Pipeline'}</strong></span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3 flex-wrap">
                    <span>Scope: <strong className="text-slate-700 font-semibold">{sched.scope}</strong></span>
                    <span>•</span>
                    <span>Retention: <strong className="text-slate-700 font-semibold">{sched.retention}</strong></span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    Last Execution: {sched.lastRun} {sched.lastDuration && sched.lastDuration !== '—' && `(${sched.lastDuration})`}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleRunScheduleNow(sched)}
                    disabled={runningScheduleId === sched.id}
                    className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#f95716] border border-orange-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs disabled:opacity-50"
                    title="Trigger Manual Run Now"
                  >
                    {runningScheduleId === sched.id ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Play size={13} />
                    )}
                    <span>Run Now</span>
                  </button>

                  <button
                    onClick={() => handleToggleSchedule(sched.id)}
                    className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                      sched.enabled
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 font-bold'
                    }`}
                    title={sched.enabled ? 'Pause Schedule' : 'Enable Schedule'}
                  >
                    <Power size={13} />
                  </button>

                  <button
                    onClick={() => handleDeleteSchedule(sched.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 border border-slate-200 transition-colors cursor-pointer"
                    title="Delete Schedule"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono flex justify-between items-center">
        <span>FastCDC Slicer Engine</span>
        <span className="text-emerald-600 font-bold">● High Availability Ready</span>
      </div>
    </div>
  );
}
