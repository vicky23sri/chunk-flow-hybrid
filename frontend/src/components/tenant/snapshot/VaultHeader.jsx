import React from 'react';
import { Database, ShieldCheck, Zap, Sparkles, RefreshCw, Layers } from 'lucide-react';

export default function VaultHeader({
  tenant,
  isRefreshing,
  onRefresh,
  onNewPipeline,
}) {
  return (
    <div className="bg-gradient-to-r from-white via-slate-50 to-orange-50/40 border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden mb-6 text-slate-900 text-left">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f95716] text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <Database size={22} />
            </div>
            <span>Backup Vault & Pipeline Topology</span>
          </h1>

          <p className="text-slate-500 text-xs sm:text-sm font-normal max-w-2xl leading-relaxed">
            Live interactive visual topology for tenant database <code className="font-mono text-[#f95716] font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200">chunkflow_tenant_{tenant?.subdomain || 'willsparrow'}</code>. Inspect PostgreSQL source parameters, AWS S3 storage configurations, and FastCDC stream connection status.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            title="Refresh Vault & Topology"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#f95716]' : 'text-slate-500'} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => onNewPipeline && onNewPipeline(null)}
            className="px-5 py-2.5 rounded-xl bg-[#f95716] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-orange-500/20"
          >
            <Layers size={15} />
            <span>New Pipeline</span>
          </button>
        </div>
      </div>
    </div>
  );
}
