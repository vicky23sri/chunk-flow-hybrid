import React from 'react';
import {
  Database, Cloud, X, Zap, Plug, Save, RefreshCw,
  CheckCircle2, AlertCircle, Unplug, ArrowRight, Trash2, Sparkles
} from 'lucide-react';
import PostgresConfigForm from './PostgresConfigForm';
import S3ConfigForm from './S3ConfigForm';

export default function NodeInspectorPanel({
  selectedNode,
  selectedNodeId,
  onCloseInspector,
  onUpdateConfig,
  showPgPassword,
  onTogglePgPassword,
  showS3Secret,
  onToggleS3Secret,
  isTestingConnection,
  testResult,
  onTestConnection,
  onSaveConfig,
  nodes,
  connections,
  onRemoveConnection,
  errors = {},
}) {
  return (
    <div className="lg:col-span-3 col-span-12 bg-white p-4 sm:p-5 border-t lg:border-t-0 border-slate-200/90 flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Header: Node Configuration Title & Close X */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-base font-black text-indigo-700 tracking-tight">
            {selectedNode ? 'Node Configuration' : 'Connection Details'}
          </h3>
          {selectedNode && (
            <button
              onClick={onCloseInspector}
              className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Inspector"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {selectedNode ? (
          <div className="space-y-4 text-xs">
            {/* Node Subheader Banner */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 mb-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  selectedNode.subtype === 'postgres'
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}
              >
                {selectedNode.subtype === 'postgres' ? <Database size={18} /> : <Cloud size={18} />}
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900 leading-snug">
                  {selectedNode.subtype === 'postgres'
                    ? 'PostgreSQL Configuration'
                    : 'Amazon S3 Configuration'}
                </h4>
              </div>
            </div>

            {/* ── POSTGRESQL CONFIGURATION ──────────────────────────────── */}
            {selectedNode.subtype === 'postgres' && (
              <PostgresConfigForm
                config={selectedNode.config || {}}
                onChange={onUpdateConfig}
                showPassword={showPgPassword}
                onTogglePassword={onTogglePgPassword}
                onTestConnection={onTestConnection}
                isTesting={isTestingConnection}
                testResult={testResult}
                errors={errors}
              />
            )}

            {/* ── AMAZON S3 CONFIGURATION ──────────────────────────────── */}
            {selectedNode.subtype === 's3' && (
              <S3ConfigForm
                config={selectedNode.config || {}}
                onChange={onUpdateConfig}
                showSecret={showS3Secret}
                onToggleSecret={onToggleS3Secret}
                onTestConnection={onTestConnection}
                isTesting={isTestingConnection}
                testResult={testResult}
                errors={errors}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Connection Overview Header Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/40 border border-slate-200">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-[#f95716] text-white flex items-center justify-center shadow-xs">
                  <Unplug size={16} />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 leading-snug">
                    Connection Wire Overview
                  </h4>
                  <p className="text-[11px] text-slate-500 font-normal">
                    {connections.length > 0
                      ? `${connections.length} active connection wire(s)`
                      : 'No active wires connected yet'}
                  </p>
                </div>
              </div>
            </div>

            {/* Connections List */}
            {connections.length > 0 ? (
              <div className="space-y-2.5">
                <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider font-mono">
                  Active Connections ({connections.length})
                </h4>

                {connections.map((conn) => {
                  const srcNode = nodes.find((n) => n.id === conn.sourceId);
                  const tgtNode = nodes.find((n) => n.id === conn.targetId);

                  return (
                    <div
                      key={conn.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-xs hover:border-orange-300 transition-all"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                          <Database size={13} />
                        </div>
                        <div className="truncate max-w-[80px]">
                          <div className="font-bold text-slate-800 text-[11px] truncate">
                            {srcNode?.title || 'Source'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">Blue Port</div>
                        </div>

                        <ArrowRight size={14} className="text-[#f95716] shrink-0 mx-0.5" />

                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                          <Cloud size={13} />
                        </div>
                        <div className="truncate max-w-[80px]">
                          <div className="font-bold text-slate-800 text-[11px] truncate">
                            {tgtNode?.title || 'Destination'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">Green Port</div>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveConnection(conn.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-colors shrink-0 ml-1 cursor-pointer"
                        title="Remove connection wire"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-dashed border-slate-300 text-slate-600 space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#f95716]" /> How to connect nodes:
                </div>
                <ol className="space-y-2 text-[11px] list-decimal list-inside text-slate-600 leading-relaxed font-normal">
                  <li>
                    Click the <strong className="text-blue-600 font-bold">Blue Circle Port</strong> on PostgreSQL node.
                  </li>
                  <li>
                    Click the <strong className="text-emerald-600 font-bold">Green Circle Port</strong> on Amazon S3 node.
                  </li>
                  <li>
                    An interactive FastCDC streaming wire will connect the two nodes!
                  </li>
                </ol>
              </div>
            )}

            {/* Canvas State Summary Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-[11px]">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>Nodes Placed:</span>
                <span className="font-mono bg-slate-200 px-2 py-0.5 rounded-md font-bold">{nodes.length}</span>
              </div>
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>Wires Connected:</span>
                <span className="font-mono bg-orange-100 text-[#f95716] px-2 py-0.5 rounded-md font-bold">
                  {connections.length}
                </span>
              </div>
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>FastCDC Engine:</span>
                <span className="text-emerald-600 font-bold">Ready</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Bar */}
      <div className="pt-4 border-t border-slate-200">
        {selectedNode ? (
          <div className="relative group w-full">
            {/* Hover Tooltip when Deactivated */}
            {!selectedNode?.isValid && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-[250px] p-2.5 bg-slate-900 text-white text-[11px] font-medium rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-30 text-center border border-slate-700/80">
                <div className="flex items-center gap-1.5 justify-center text-amber-400 font-bold mb-0.5">
                  <AlertCircle size={13} /> Test Connection Required
                </div>
                <span className="text-slate-200 leading-tight block">
                  Save Config is deactivated. Click <strong>"Test Connection"</strong> in the form above to activate.
                </span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
              </div>
            )}

            <button
              onClick={onSaveConfig}
              disabled={!selectedNodeId || !selectedNode?.isValid || isTestingConnection}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 bg-[#f95716] hover:bg-orange-600 text-white"
            >
              <Save size={14} />
              <span>Save Config</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-1">
            <span className="text-[11px] text-slate-400 font-normal">
              Click any node on canvas to edit configuration
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
