import React from 'react';
import { Database, Clock } from 'lucide-react';

export default function ActivityFeed({ snapshots }) {
  // Sort descending (newest first)
  const sorted = [...(snapshots || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  return (
    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-xs overflow-hidden h-[380px]">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div>
          <h3 className="text-sm font-black text-slate-900">Activity Feed</h3>
          <p className="text-[11px] font-bold text-slate-500 mt-0.5">Recent system events and captures</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
          <Database size={14} className="text-emerald-500" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {sorted.length > 0 ? (
          <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
            {sorted.map((snap) => {
              const d = new Date(snap.timestamp);
              return (
                <div key={snap.id} className="relative pl-6 group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-200 group-hover:border-emerald-400 transition-colors flex items-center justify-center shadow-[0_0_0_4px_white]">
                    <div className="w-1.5 h-1.5 bg-slate-300 group-hover:bg-emerald-500 rounded-full transition-colors"></div>
                  </div>
                  
                  {/* Content */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-black text-slate-900">Snapshot Captured</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Success
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                      System successfully completed chunking operations and committed snapshot <code className="text-slate-600 font-mono font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">{snap.id.substring(0, 18)}...</code> to vault.
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Clock size={12} />
                      {d.toLocaleDateString()} • {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
              <Clock size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-black text-slate-900">No Activity Yet</p>
            <p className="text-xs text-slate-500 mt-1">Your timeline will populate once workflows execute.</p>
          </div>
        )}
      </div>
    </div>
  );
}
