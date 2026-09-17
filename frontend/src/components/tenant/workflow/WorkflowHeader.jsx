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
    <div className="bg-slate-50/80 px-7 py-4 border-b border-slate-200/80 flex flex-wrap justify-between items-center gap-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#f95716] border border-orange-200 flex items-center justify-center shadow-xs">
          <Database size={20} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            Database-to-S3 Backup Workflow Builder
            <span className="text-[10px] font-mono font-bold bg-orange-50 text-[#f95716] border border-orange-200 px-2.5 py-0.5 rounded-full">
              FULL CANVAS
            </span>
          </h2>
          <p className="text-slate-500 text-xs font-normal mt-0.5">
            Drag nodes onto canvas • Move placed nodes • Click <strong className="text-blue-600 font-bold">Blue dot</strong> to <strong className="text-emerald-600 font-bold">Green dot</strong> to connect wire
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {deploySuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 animate-in fade-in duration-200">
            <CheckCircle2 size={14} /> Pipeline Active & Deployed
          </span>
        )}

        <button
          onClick={onClearCanvas}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-2xs"
        >
          Clear Canvas
        </button>

        <button
          onClick={onDeploy}
          disabled={isDeploying || nodeCount === 0}
          className="px-5 py-2.5 rounded-xl bg-[#f95716] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-orange-500/20 disabled:opacity-50"
        >
          {isDeploying ? (
            <RefreshCw size={15} className="animate-spin" />
          ) : (
            <Play size={15} />
          )}
          <span>{isDeploying ? 'Deploying...' : 'Deploy Workflow'}</span>
        </button>
      </div>
    </div>
  );
}
