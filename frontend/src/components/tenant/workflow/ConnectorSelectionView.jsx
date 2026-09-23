import React, { useState } from 'react';
import {
  Database, Plus, Cloud, Zap, Eye, EyeOff, X,
  RefreshCw, Search, Server, Key, GitMerge, ArrowRight, Lock, Box
} from 'lucide-react';
import CreateConnectorModal from './CreateConnectorModal';

export default function ConnectorSelectionView({ connectors, onSelectConnector, onAddConnector }) {
  const [selectedPayload, setSelectedPayload] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredConnectors = connectors?.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleConnectorCreated = (newConnector) => {
    setShowCreateModal(false);
    if (onAddConnector) onAddConnector(newConnector);
  };

  return (
    <div className="flex flex-col gap-5 min-h-[calc(100vh-125px)]">

      <style>{`
        @keyframes live-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          60%       { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        @keyframes wire-march {
          to { stroke-dashoffset: -16; }
        }
        .live-dot  { animation: live-glow 2.2s ease-in-out infinite; }
        .wire-anim { animation: wire-march 0.8s linear infinite; }
        .row-card  { transition: box-shadow 0.15s, background 0.15s, border-color 0.15s; }
        .row-card:hover { background: #fffbf8; border-color: #fed7aa; box-shadow: 0 2px 16px 0 rgba(249,87,22,0.07); }
      `}</style>

      {/* ─── Page Header ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-orange-100 rounded-full opacity-30 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3.5 relative">
          <div className="w-11 h-11 rounded-2xl bg-[#f95716] flex items-center justify-center shadow-lg shadow-orange-400/30 shrink-0">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">Workflow Builder Canvas</h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">Design and orchestrate your FastCDC data pipelines</p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative shrink-0">
          <button className="h-9 px-3.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors">
            <RefreshCw size={13} className="text-slate-400" /> Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-9 px-4 bg-[#f95716] hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-orange-400/25"
          >
            <Plus size={15} strokeWidth={2.5} /> New Connector
          </button>
        </div>
      </div>

      {/* ─── Table Panel ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

        {/* Search toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by pipeline name or ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm font-medium text-slate-700 placeholder-slate-400 bg-transparent outline-none min-w-0"
          />
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full shrink-0 whitespace-nowrap">
            {filteredConnectors.length} pipeline{filteredConnectors.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredConnectors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              {/* Column headers */}
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[28%]">Pipeline</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[36%]">Source → Destination</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[10%]">Nodes</th>
                  <th className="text-center px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[10%]">Wires</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[16%]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredConnectors.map((conn) => {
                  let nodes = [], edges = [];
                  try {
                    if (Array.isArray(conn.nodes_data)) nodes = conn.nodes_data;
                    else if (typeof conn.nodes_data === 'string') nodes = JSON.parse(conn.nodes_data);
                    else if (Array.isArray(conn.nodes)) nodes = conn.nodes;

                    if (Array.isArray(conn.edges_data)) edges = conn.edges_data;
                    else if (typeof conn.edges_data === 'string') edges = JSON.parse(conn.edges_data);
                    else if (Array.isArray(conn.edges)) edges = conn.edges;
                  } catch (e) {}
                  const isConfigured = conn.is_configured || false;
                  const numNodes = isConfigured ? 2 : 0;
                  const numEdges = isConfigured ? 1 : 0;

                  return (
                    <tr
                      key={conn.id || conn.name}
                      className="row-card border-b border-slate-100 last:border-0 cursor-pointer"
                      onClick={() => onSelectConnector(conn)}
                    >
                      {/* ── Pipeline Name ── */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                              <Database size={16} className="text-[#f95716]" />
                            </div>
                            {isConfigured && <span className="live-dot absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-black text-slate-900 truncate leading-snug">
                              {conn.name || 'Untitled Pipeline'}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                              ID: {(conn.id || conn.connector_id || '—').slice(0, 8)}… • Created: {conn.created_at ? new Date(conn.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ── Flow Diagram ── */}
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        {isConfigured ? (
                          <div className="flex items-center gap-1.5">
                            {/* Source pill */}
                            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200/70 rounded-xl px-2.5 py-2 min-w-0 flex-1">
                              <div className="w-5 h-5 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                                <Server size={11} className="text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-wide leading-none">Source</p>
                                <p className="text-[11px] font-bold text-blue-800 truncate leading-tight">PostgreSQL</p>
                              </div>
                            </div>

                            {/* Animated SVG wire */}
                            <svg width="36" height="14" viewBox="0 0 36 14" fill="none" className="shrink-0">
                              <line x1="0" y1="7" x2="30" y2="7" stroke="#e2e8f0" strokeWidth="1.5" />
                              <line
                                x1="0" y1="7" x2="30" y2="7"
                                stroke="#f95716" strokeWidth="1.5"
                                strokeDasharray="5 5"
                                className="wire-anim"
                                strokeLinecap="round"
                              />
                              <path d="M26 3.5 L32 7 L26 10.5" stroke="#f95716" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                            </svg>

                            {/* Destination pill */}
                            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/70 rounded-xl px-2.5 py-2 min-w-0 flex-1">
                              <div className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                                <Cloud size={11} className="text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wide leading-none">Destination</p>
                                <p className="text-[11px] font-bold text-emerald-800 truncate leading-tight">Amazon S3</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            <span className="text-[11px] font-bold text-slate-500">Not configured yet</span>
                          </div>
                        )}
                      </td>

                      {/* ── Nodes ── */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                          <Box size={12} className="text-orange-400 shrink-0" />
                          <span className="text-[13px] font-black text-slate-800 leading-none">{numNodes}</span>
                        </div>
                      </td>

                      {/* ── Wires ── */}
                      <td className="px-4 py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
                          <GitMerge size={12} className="text-violet-400 shrink-0" />
                          <span className="text-[13px] font-black text-slate-800 leading-none">{numEdges}</span>
                        </div>
                      </td>

                      {/* ── Actions ── */}
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedPayload(conn); setShowSecret(false); }}
                            className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50 text-slate-400 hover:text-[#f95716] flex items-center justify-center transition-all cursor-pointer"
                            title="View config"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onSelectConnector(conn); }}
                            className="h-8 px-3.5 bg-slate-900 hover:bg-[#f95716] text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm whitespace-nowrap"
                          >
                            Open Canvas <ArrowRight size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <Database size={26} className="text-slate-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 mb-1">No Pipelines Found</h3>
              <p className="text-sm text-slate-400 max-w-xs">Create a new pipeline to start streaming with FastCDC.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-1 h-10 px-5 bg-[#f95716] hover:bg-orange-600 text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-orange-400/25 transition-colors"
            >
              <Plus size={16} strokeWidth={2.5} /> New Connector
            </button>
          </div>
        )}
      </div>

      {/* ─── Create Connector Modal ───────────────────────────── */}
      <CreateConnectorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleConnectorCreated}
      />

      {/* ─── Pipeline Details Modal ───────────────────────────── */}
      {selectedPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh] border border-slate-200">

            {/* Header */}
            <div className="relative bg-slate-900 px-7 py-5 flex items-center justify-between overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-[#f95716]/10 pointer-events-none" />
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#f95716]/15 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 relative">
                <div className="w-10 h-10 rounded-xl bg-[#f95716]/15 border border-[#f95716]/25 flex items-center justify-center">
                  <Lock size={16} className="text-[#f95716]" />
                </div>
                <div>
                  <p className="text-white font-black text-[15px] leading-snug truncate max-w-[300px]">{selectedPayload.name || 'Pipeline'}</p>
                  <p className="text-[#f95716] text-[10px] font-bold uppercase tracking-widest mt-0.5">Configuration & Secrets</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayload(null)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Source Card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Server size={13} className="text-white" />
                  </div>
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">PostgreSQL Source</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {[
                    ['Database', selectedPayload.database || 'public'],
                    ['Host', selectedPayload.host || 'localhost'],
                    ['Port', selectedPayload.port || '5432'],
                    ['Username', selectedPayload.username || 'admin'],
                    ['SSL', selectedPayload.useSSL ? 'Enabled' : 'Disabled'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs text-slate-400 font-semibold">{label}</span>
                      <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg ${label === 'SSL' && selectedPayload.useSSL ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-700 border border-slate-100'}`}>
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destination Card */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <Cloud size={13} className="text-white" />
                  </div>
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Amazon S3 Destination</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {[
                    ['Bucket', selectedPayload.bucketName || 'vault-default'],
                    ['Region', selectedPayload.region || 'us-east-1'],
                    ['Storage', 'Standard'],
                    ['Encryption', 'AES-256 SSE'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between px-5 py-3">
                      <span className="text-xs text-slate-400 font-semibold">{label}</span>
                      <span className="text-xs font-bold font-mono bg-slate-50 text-slate-700 border border-slate-100 px-2.5 py-1 rounded-lg">{val}</span>
                    </div>
                  ))}
                  {/* Secret key row */}
                  <div className="px-5 py-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-semibold">Access Key ID</span>
                      <button
                        onClick={() => setShowSecret(!showSecret)}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#f95716] hover:bg-orange-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        {showSecret ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showSecret ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 rounded-xl px-3.5 py-2.5 border border-slate-800">
                      <Key size={13} className="text-slate-500 shrink-0" />
                      <span className="text-xs font-mono text-orange-300 flex-1 truncate">
                        {showSecret
                          ? (selectedPayload.accessKeyId || 'AKIAIOSFODNN7EXAMPLE')
                          : `••••••••••••${(selectedPayload.accessKeyId || 'XWMW').slice(-4)}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono text-slate-400 truncate">
                ID: {selectedPayload.id || selectedPayload.connector_id || '—'}
              </span>
              <button
                onClick={() => setSelectedPayload(null)}
                className="h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shrink-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
