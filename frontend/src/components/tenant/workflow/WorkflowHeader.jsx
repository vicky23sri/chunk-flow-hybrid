import React from 'react';
import { Database, CheckCircle2, Play, RefreshCw, AlertCircle, Layers } from 'lucide-react';

export default function WorkflowHeader({
  deploySuccess,
  isDeploying,
  nodes = [],
  connections = [],
  onClearCanvas,
  onDeploy,
  initialWorkflow,
}) {

  const hasPgNode = nodes.some((n) => n.subtype === 'postgres' || n.category === 'source');
  const hasS3Node = nodes.some((n) => n.subtype === 's3' || n.category === 'destination');
  const hasConnection = connections && connections.length > 0;
  const unconfiguredNodes = nodes.filter((n) => !n.isValid);

  const missingRequirements = [];
  if (nodes.length === 0) {
    missingRequirements.push('Place a Source Node & Destination Node on canvas');
  } else {
    if (!hasPgNode) missingRequirements.push('Add a Source node to canvas');
    if (!hasS3Node) missingRequirements.push('Add a Destination node to canvas');
    if (!hasConnection) missingRequirements.push('Connect Blue dot on Source to Green dot on Destination with a wire');
    if (unconfiguredNodes.length > 0) missingRequirements.push('Configure and save settings on all canvas nodes');
  }

  const isDeployable = missingRequirements.length === 0 && !isDeploying;
  const workflowName = initialWorkflow?.name || 'New Pipeline Workflow';

  return (
    <>
      <div className="bg-slate-50/80 px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-200/80 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-orange-50 text-[#f95716] border border-orange-200 flex items-center justify-center shadow-xs shrink-0">
            <Database size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Workflow Name Directly */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-slate-900 truncate">
                  {workflowName}
                </span>
              </div>

              <span className="text-[10px] font-mono font-bold bg-orange-50 text-[#f95716] border border-orange-200 px-2 py-0.5 rounded-full shrink-0">
                FULL CANVAS
              </span>
            </div>

            <p className="text-slate-500 text-[11px] sm:text-xs font-normal mt-1 truncate">
              Drag nodes onto canvas • Click <strong className="text-blue-600 font-bold">Blue dot</strong> to <strong className="text-emerald-600 font-bold">Green dot</strong> to connect wire
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

          <div className="relative group">
            {!isDeployable && (
              <div className="absolute top-full right-0 mt-2.5 w-[290px] p-3.5 bg-slate-900 text-white text-[11px] font-medium rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 text-left border border-slate-700/80">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1.5 border-b border-slate-800 pb-1.5">
                  <AlertCircle size={14} className="shrink-0 text-amber-400" />
                  <span>Deploy Workflow Disabled</span>
                </div>
                <p className="text-slate-300 text-[10px] mb-2 leading-tight font-normal">
                  Complete all workflow pipeline requirements to activate deployment:
                </p>
                <ul className="space-y-1.5 text-[10px]">
                  {missingRequirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-rose-300 font-medium leading-tight">
                      <span className="text-rose-500 font-bold shrink-0">✕</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
                <div className="absolute bottom-full right-8 border-4 border-transparent border-b-slate-900" />
              </div>
            )}

            <button
              onClick={onDeploy}
              disabled={!isDeployable}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none bg-[#f95716] hover:bg-orange-600 text-white cursor-pointer"
            >
              {isDeploying ? (
                <RefreshCw size={14} className="animate-spin text-slate-500" />
              ) : (
                <Play size={14} />
              )}
              <span>{isDeploying ? 'Deploying...' : 'Deploy Workflow'}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
