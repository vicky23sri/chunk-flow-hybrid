import React from 'react';
import { Database, CheckCircle2, Play, RefreshCw } from 'lucide-react';

export default function WorkflowHeader({
  deploySuccess,
  isDeploying,
  nodeCount,
  onClearCanvas,
  onDeploy,
}) {
  return (
    <div className="bg-slate-50/80 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200/80 flex flex-wrap justify-between items-center gap-3 shrink-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-orange-50 text-[#f95716] border border-orange-200 flex items-center justify-center shadow-xs shrink-0">
          <Database size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
            Database-to-S3 Backup Workflow Builder
            <span className="text-[10px] font-mono font-bold bg-orange-50 text-[#f95716] border border-orange-200 px-2 py-0.5 rounded-full shrink-0">
              FULL CANVAS
            </span>
          </h2>
          <p className="text-slate-500 text-[11px] sm:text-xs font-normal mt-0.5 truncate">
            Drag nodes onto canvas • Move placed nodes • Click <strong className="text-blue-600 font-bold">Blue dot</strong> to <strong className="text-emerald-600 font-bold">Green dot</strong> to connect wire
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {deploySuccess && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 animate-in fade-in duration-200">
            <CheckCircle2 size={13} /> Deployed
          </span>
        )}

        <button
          onClick={onClearCanvas}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-2xs"
        >
          Clear Canvas
        </button>

        <button
          onClick={onDeploy}
          disabled={isDeploying || nodeCount === 0}
          className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#f95716] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-orange-500/20 disabled:opacity-50"
        >
          {isDeploying ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
          <span>{isDeploying ? 'Deploying...' : 'Deploy Workflow'}</span>
        </button>
      </div>
    </div>
  );
}
