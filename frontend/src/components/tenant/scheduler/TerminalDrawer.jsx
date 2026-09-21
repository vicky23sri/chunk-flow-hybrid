import React from 'react';
import { Terminal, X } from 'lucide-react';

export default function TerminalDrawer({ showTerminal, setShowTerminal, terminalLogs }) {
  if (!showTerminal) return null;

  return (
    <div className="bg-slate-950 text-slate-100 p-5 rounded-3xl border border-slate-800 shadow-2xl space-y-3 font-mono text-xs animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-emerald-400" />
          <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">Cron Execution Logs & Telemetry</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            LIVE TERMINAL STREAM
          </span>
        </div>

        <button
          onClick={() => setShowTerminal(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300">
        {terminalLogs.length > 0 ? (
          terminalLogs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-emerald-500 shrink-0">❯</span>
              <span>{log}</span>
            </div>
          ))
        ) : (
          <div className="text-slate-500 italic">
            Terminal ready. Click "Run Now" on any schedule rule to stream real-time execution logs...
          </div>
        )}
      </div>
    </div>
  );
}
