import React, { useEffect, useState } from 'react';
import { Database, Cloud, Zap, Server, Globe, HardDrive, Layers, Sparkles, Loader2, Plus, Terminal, X, AlertTriangle, Check, Lock, ArrowRight } from 'lucide-react';
import { getActiveSubdomain } from '../../services/api';
import { showSuccess, showError } from '../../utils/toast';
import { ICON_MAP, BRAND } from '../../utils/nodeHelpers';
import PageHeader from '../shared/PageHeader';

const GO_API_BASE = import.meta.env.VITE_GO_API_URL || 'http://localhost:8080/api/v1';

export default function SavedNodesListView() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailNode, setDetailNode] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState({ show: false, nodeId: null, connectors: [] });

  useEffect(() => { fetchNodes(); }, []);

  const fetchNodes = () => {
    const sub = getActiveSubdomain() || 'default';
    fetch(`${GO_API_BASE}/nodes?subdomain=${encodeURIComponent(sub)}`)
      .then(r => r.json())
      .then(d => { if (d?.success && Array.isArray(d.data)) setNodes(d.data); })
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  const toggle = (id, active, force = false) => {
    const sub = getActiveSubdomain() || 'default';
    let url = `${GO_API_BASE}/nodes/${id}/toggle?subdomain=${encodeURIComponent(sub)}`;
    if (force) url += '&force=true';
    fetch(url, { method: 'POST' })
      .then(async r => {
        if (r.status === 409) { const d = await r.json(); setShowConfirmModal({ show: true, nodeId: id, connectors: d.connectors || [] }); return; }
        return r.json();
      })
      .then(d => {
        if (!d) return;
        if (d.success) {
          showSuccess(`Driver ${d.is_active ? 'enabled' : 'disabled'}`, 'Updated');
          setNodes(p => p.map(n => n.id === id ? { ...n, is_active: d.is_active } : n));
          if (detailNode?.id === id) setDetailNode(prev => ({ ...prev, is_active: d.is_active }));
        } else showError('Update failed');
      })
      .catch(() => showError('Network error'));
  };

  const sources = nodes.filter(n => n.category === 'source');
  const dests = nodes.filter(n => n.category === 'destination');

  const NodeCard = ({ node }) => {
    const Icon = ICON_MAP[node.sub_type] || Database;
    const brand = BRAND[node.sub_type] || BRAND.postgres;

    return (
      <div
        className="group relative bg-white rounded-[20px] border border-slate-200/80 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 hover:border-slate-300/80"
        style={{ '--brand': brand.color }}
        onClick={() => setDetailNode(node)}
      >
        {/* Top Color Strip */}
        <div className="h-1 w-full" style={{ background: node.is_active ? brand.color : '#e2e8f0' }} />

        <div className="p-6">
          {/* Icon + Status */}
          <div className="flex items-start justify-between mb-5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: node.is_active ? brand.light : '#f8fafc', color: node.is_active ? brand.color : '#94a3b8' }}
            >
              <Icon size={24} strokeWidth={1.8} />
            </div>
            
            {node.is_active ? (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-300" />
                Inactive
              </span>
            )}
          </div>

          {/* Name + Description */}
          <h3 className={`text-[15px] font-semibold tracking-[-0.01em] mb-1 transition-colors ${node.is_active ? 'text-slate-900' : 'text-slate-400'}`}>
            {brand.name}
          </h3>
          <p className={`text-[12px] leading-[1.5] line-clamp-2 ${node.is_active ? 'text-slate-500' : 'text-slate-300'}`}>
            {brand.desc}
          </p>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className={`text-[11px] font-mono ${node.is_active ? 'text-slate-400' : 'text-slate-300'}`}>
              {node.sub_type} · {node.fields_schema?.length || 0} fields
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────── */}
      <PageHeader
        icon={Layers}
        title="Integrations"
        description="Source and destination drivers available for your data pipelines"
        actions={
            <button
              onClick={() => setShowAddModal(true)}
              className="h-9 px-4 bg-[#f95716] hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-orange-400/25"
            >
              <Plus size={15} strokeWidth={2.5} /> Add Driver
            </button>
          }
        />

        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
            <p className="text-sm text-slate-400 mt-4">Loading drivers…</p>
          </div>
        ) : (
          <>
            {/* ── Sources ─────────────────────────────── */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[12px] font-semibold text-slate-900 uppercase tracking-[0.08em]">Sources</span>
                <span className="flex-1 h-px bg-slate-200" />
                <span className="text-[12px] font-medium text-slate-400">{sources.length} drivers</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sources.map(n => <NodeCard key={n.id} node={n} />)}
              </div>
            </div>

            {/* ── Destinations ────────────────────────── */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[12px] font-semibold text-slate-900 uppercase tracking-[0.08em]">Destinations</span>
                <span className="flex-1 h-px bg-slate-200" />
                <span className="text-[12px] font-medium text-slate-400">{dests.length} drivers</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dests.map(n => <NodeCard key={n.id} node={n} />)}
              </div>
            </div>
          </>
        )}

      {/* ── Detail Sheet ──────────────────────────────── */}
      {detailNode && (() => {
        const Icon = ICON_MAP[detailNode.sub_type] || Database;
        const brand = BRAND[detailNode.sub_type] || BRAND.postgres;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/30 backdrop-blur-[6px]" onClick={() => setDetailNode(null)}>
            <div
              className="bg-white w-full max-w-lg rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 pb-6 relative">
                <button onClick={() => setDetailNode(null)} className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                  <X size={18} />
                </button>

                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: brand.light, color: brand.color }}
                  >
                    <Icon size={28} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-[-0.02em]">{brand.name}</h2>
                    <p className="text-[12px] text-slate-400 font-mono mt-0.5">{detailNode.category} · {detailNode.sub_type}</p>
                  </div>
                </div>

                <p className="text-[13px] text-slate-500 leading-relaxed">{brand.desc}</p>

                {/* Toggle Bar */}
                <div className="mt-5 flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${detailNode.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {detailNode.is_active ? <Check size={16} strokeWidth={3} /> : <Lock size={14} />}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-800">{detailNode.is_active ? 'Enabled' : 'Disabled'}</div>
                      <div className="text-[11px] text-slate-400">{detailNode.is_active ? 'Available on canvas' : 'Hidden from builder'}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(detailNode.id, detailNode.is_active)}
                    className={`relative w-[44px] h-[26px] rounded-full transition-colors cursor-pointer ${detailNode.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${detailNode.is_active ? 'left-[21px]' : 'left-[3px]'}`} />
                  </button>
                </div>
              </div>

              {/* Config Fields */}
              <div className="px-8 pb-8">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.1em] mb-3">Configuration Fields</div>
                <div className="space-y-1.5">
                  {detailNode.fields_schema?.map((f, i) => (
                    <div key={f.key} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-300 w-4 text-right">{i + 1}</span>
                        <div>
                          <span className="text-[13px] font-medium text-slate-700">{f.label}</span>
                          <span className="text-[11px] font-mono text-slate-400 ml-2">{f.key}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {f.required && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 uppercase">req</span>}
                        <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">{f.type}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Meta */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-400">
                  <span className="font-mono">key: {detailNode.node_key}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                  <span className="font-mono">id: {detailNode.id?.substring(0, 12)}…</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add Modal ─────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[6px] p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="px-8 pt-8 pb-5">
              <h3 className="text-lg font-bold text-slate-900">New Driver</h3>
              <p className="text-[13px] text-slate-500 mt-1">Register a custom integration node.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); showSuccess("Node registered!", "Added"); }} className="px-8 pb-8 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Name</label>
                <input required type="text" placeholder="Firebase Firestore" className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Category</label>
                  <select className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option>Source</option><option>Destination</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">Driver key</label>
                  <input required type="text" placeholder="firestore" className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl cursor-pointer">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ─────────────────────────────── */}
      {showConfirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[6px] p-4">
          <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center"><AlertTriangle size={20} /></div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Driver in use</h3>
                <p className="text-[12px] text-slate-500">Deactivating will affect running connectors.</p>
              </div>
            </div>
            <div className="px-8 pb-4">
              <ul className="list-disc pl-5 text-sm font-semibold text-slate-800 space-y-1">
                {showConfirmModal.connectors.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
            <div className="px-8 pb-8 flex justify-end gap-3">
              <button onClick={() => setShowConfirmModal({ show: false, nodeId: null, connectors: [] })} className="px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 rounded-xl cursor-pointer">Cancel</button>
              <button onClick={() => { if (showConfirmModal.nodeId) toggle(showConfirmModal.nodeId, true, true); setShowConfirmModal({ show: false, nodeId: null, connectors: [] }); }} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl cursor-pointer">Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
