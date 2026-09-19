import React from 'react';
import { Database, Plus } from 'lucide-react';
import WorkflowNodeCard from './WorkflowNodeCard';

export default function WorkflowCanvas({
  canvasRef,
  nodes,
  connections,
  selectedNodeId,
  connectingSourceId,
  onDragOverCanvas,
  onDropCanvas,
  onMouseMoveCanvas,
  onMouseUpCanvas,
  onNodeMouseDown,
  onPortClick,
  onDeleteNode,
  onCreateNode,
}) {
  return (
    <div
      ref={canvasRef}
      onDragOver={onDragOverCanvas}
      onDrop={onDropCanvas}
      onMouseMove={onMouseMoveCanvas}
      onMouseUp={onMouseUpCanvas}
      className="lg:col-span-6 col-span-12 bg-[#fafbfc] relative flex flex-col justify-between overflow-hidden min-h-[480px] lg:min-h-0 select-none flex-1 border-r border-slate-200/80"
    >
      {/* Grid Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}
      />

      {/* Empty Canvas State (Perfectly Centered) */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 m-auto w-[90%] max-w-md h-fit p-8 bg-white/95 backdrop-blur-md rounded-3xl border-2 border-dashed border-slate-300 shadow-xl text-center z-20 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#f95716] border border-orange-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Database size={30} />
          </div>
          <h4 className="font-black text-xl text-slate-900 tracking-tight">Canvas Ready</h4>
          <p className="text-xs text-slate-500 mt-1.5 mb-6 font-normal leading-relaxed max-w-xs mx-auto">
            Drag nodes from the left sidebar onto this canvas or click below to build your pipeline:
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              onClick={() => onCreateNode('source', 'postgres')}
              className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus size={14} /> Add PostgreSQL Source
            </button>
            <button
              onClick={() => onCreateNode('destination', 's3')}
              className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Amazon S3 Vault (Destination)
            </button>
          </div>
        </div>
      )}

      {/* Interactive Connection Wires SVG (Connecting Blue Dot -> Green Dot) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {connections.map((conn) => {
          const srcNode = nodes.find((n) => n.id === conn.sourceId);
          const tgtNode = nodes.find((n) => n.id === conn.targetId);
          if (!srcNode || !tgtNode) return null;

          // Blue dot position: exact center of blue output circle at right edge of node card (w-64 = 256px, h-110 = 55px)
          const x1 = srcNode.x + 256;
          const y1 = srcNode.y + 55;

          // Green dot position: exact center of green input circle at left edge of node card
          const x2 = tgtNode.x;
          const y2 = tgtNode.y + 55;

          const dx = Math.abs(x2 - x1) / 2;

          return (
            <g key={conn.id}>
              {/* Glowing outer shadow */}
              <path
                d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="#f95716"
                strokeWidth="6"
                strokeOpacity="0.2"
              />
              {/* Solid main connection wire */}
              <path
                d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="#f95716"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* White animated data flow pulses */}
              <path
                d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="4,6"
                className="animate-pulse"
              />
            </g>
          );
        })}
      </svg>

      {/* Render Nodes on Canvas Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {nodes.map((node) => (
          <WorkflowNodeCard
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            connectingSourceId={connectingSourceId}
            onNodeMouseDown={onNodeMouseDown}
            onPortClick={onPortClick}
            onDeleteNode={onDeleteNode}
          />
        ))}
      </div>

      {/* Bottom Canvas Footer Bar */}
      <div className="relative z-10 flex justify-between items-center text-[11px] text-slate-500 font-mono p-4 border-t border-slate-200/80 bg-white/50 backdrop-blur-xs mt-auto">
        <span>Canvas State: {nodes.length} Nodes • {connections.length} Wire Connected</span>
        <span className="text-emerald-600 font-bold">● FastCDC Stream Slicer Ready</span>
      </div>
    </div>
  );
}
