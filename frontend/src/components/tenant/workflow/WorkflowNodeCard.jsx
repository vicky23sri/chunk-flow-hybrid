import React from 'react';
import { Database, Cloud, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

export default function WorkflowNodeCard({
  node,
  isSelected,
  connectingSourceId,
  onNodeMouseDown,
  onPortClick,
  onDeleteNode,
}) {
  const isSource = node.type === 'source';
  const isPostgres = node.subtype === 'postgres';

  return (
    <div
      onMouseDown={(e) => onNodeMouseDown(e, node.id)}
      onTouchStart={(e) => onNodeMouseDown(e, node.id)}
      style={{ left: `${node.x}px`, top: `${node.y}px` }}
      className={`absolute w-64 h-[110px] p-3 rounded-xl bg-white border transition-all duration-150 cursor-move shadow-sm hover:shadow-md flex flex-col justify-between select-none pointer-events-auto ${
        isSelected
          ? 'border-[#f95716] ring-2 ring-orange-500/20 shadow-md z-30'
          : 'border-slate-200 hover:border-slate-300 z-20'
      }`}
    >
      {/* 🟢 GREEN DOT: Destination Input Port (Vertically Centered on Left Edge) */}
      {!isSource && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onPortClick(node);
          }}
          className={`port-dot absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 bg-white border-emerald-500 text-emerald-600 flex items-center justify-center cursor-pointer shadow-sm hover:scale-110 transition-transform z-40 ${
            connectingSourceId ? 'ring-4 ring-emerald-400/50 animate-bounce' : ''
          }`}
          title="Input Port: Click to connect wire here"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
      )}

      {/* 🔵 BLUE DOT: Source Output Port (Vertically Centered on Right Edge) */}
      {isSource && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onPortClick(node);
          }}
          className={`port-dot absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 bg-white border-blue-600 text-blue-600 flex items-center justify-center cursor-pointer shadow-sm hover:scale-110 transition-transform z-40 ${
            connectingSourceId === node.id ? 'ring-4 ring-blue-400/50 animate-pulse' : ''
          }`}
          title="Output Port: Click to start wire from here"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
        </div>
      )}

      {/* Compact Main Content Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold shadow-xs ${
              isPostgres ? 'bg-blue-600' : 'bg-emerald-600'
            }`}
          >
            {isPostgres ? <Database size={16} /> : <Cloud size={16} />}
          </div>

          <div className="min-w-0">
            <h4 className="font-bold text-xs text-slate-900 leading-tight whitespace-nowrap overflow-hidden text-ellipsis" title={node.config?.name || node.title}>
              {node.config?.name || node.title}
            </h4>
            <p className="text-[11px] font-mono text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis mt-0.5" title={node.subtitle}>
              {node.subtitle}
            </p>
          </div>
        </div>

        <span
          className={`text-[9px] font-mono font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 ${
            isSource
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}
        >
          {node.type}
        </span>
      </div>

      {/* Footer Status Bar - Compact & High Contrast */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs mt-1">
        {node.isValid ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
            <CheckCircle2 size={11} className="text-emerald-600" /> Configured
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
            <AlertCircle size={11} className="text-amber-600" /> Needs Config
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteNode(node.id);
          }}
          className="delete-btn text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded p-1 transition-colors cursor-pointer"
          title="Remove Node"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
