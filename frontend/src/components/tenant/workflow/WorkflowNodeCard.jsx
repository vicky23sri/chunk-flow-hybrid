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
  let iconStyle = 'text-blue-600 bg-blue-50 border-blue-200';
  if (node.type === 'destination') iconStyle = 'text-emerald-600 bg-emerald-50 border-emerald-200';

  return (
    <div
      onMouseDown={(e) => onNodeMouseDown(e, node.id)}
      style={{ left: `${node.x}px`, top: `${node.y}px` }}
      className={`absolute w-56 h-[130px] p-3.5 rounded-2xl bg-white border transition-shadow duration-150 cursor-move shadow-xs hover:shadow-md flex flex-col justify-between ${
        isSelected
          ? 'border-[#f95716] ring-4 ring-orange-500/10 shadow-md shadow-orange-500/10'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* 🟢 GREEN DOT: Destination Input Port (Vertically Centered on Left) */}
      {node.type === 'destination' && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onPortClick(node);
          }}
          className={`port-dot absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 bg-emerald-500 border-white text-white flex items-center justify-center cursor-pointer shadow-md shadow-emerald-500/30 transition-transform hover:scale-125 z-30 ${
            connectingSourceId ? 'ring-4 ring-emerald-400/40 animate-bounce' : ''
          }`}
          title="Green Input Dot: Click to complete connection wire"
        >
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      )}

      {/* 🔵 BLUE DOT: Source Output Port (Vertically Centered on Right) */}
      {node.type === 'source' && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onPortClick(node);
          }}
          className={`port-dot absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 bg-blue-600 border-white text-white flex items-center justify-center cursor-pointer shadow-md shadow-blue-500/30 transition-transform hover:scale-125 z-30 ${
            connectingSourceId === node.id ? 'ring-4 ring-blue-400/40 animate-pulse' : ''
          }`}
          title="Blue Output Dot: Click to start connection wire"
        >
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${iconStyle}`}>
          {node.subtype === 'postgres' ? <Database size={16} /> : <Cloud size={16} />}
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-700">
          {node.type}
        </span>
      </div>

      {/* Title & Subtitle */}
      <div className="mb-3">
        <h4 className="font-black text-xs text-slate-900 tracking-tight leading-snug truncate">
          {node.title}
        </h4>
        <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
          {node.subtitle}
        </div>
      </div>

      {/* Node Footer: Shows Configured (Green) or Needs Config (Yellow) */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
        {node.isValid ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
            <CheckCircle2 size={11} /> Configured
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
            <AlertCircle size={11} /> Needs Config
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteNode(node.id);
          }}
          className="delete-btn text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
          title="Remove Node"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
