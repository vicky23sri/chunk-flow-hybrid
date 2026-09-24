import React, { useEffect, useState } from 'react';
import { Database, Cloud, Zap, Server, Globe, HardDrive, Layers, Sparkles, Loader2, Plus, Terminal, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { getActiveSubdomain } from '../../services/api';
import { showSuccess, showError } from '../../utils/toast';

const GO_API_BASE = import.meta.env.VITE_GO_API_URL || 'http://localhost:8080/api/v1';

const ICON_MAP = {
  postgres: Database,
  mysql: Database,
  kafka: Zap,
  mongodb: Server,
  webhook: Globe,
  s3: Cloud,
  gcs: Cloud,
  redis: HardDrive,
  snowflake: Layers,
  pinecone: Sparkles,
};

const COLOR_MAP = {
  blue: { badge: 'text-blue-600 bg-blue-50 border-blue-200', border: 'border-blue-500/20' },
  emerald: { badge: 'text-emerald-600 bg-emerald-50 border-emerald-200', border: 'border-emerald-500/20' },
  purple: { badge: 'text-purple-600 bg-purple-50 border-purple-200', border: 'border-purple-500/20' },
  amber: { badge: 'text-amber-600 bg-amber-50 border-amber-200', border: 'border-amber-500/20' },
  rose: { badge: 'text-rose-600 bg-rose-50 border-rose-200', border: 'border-rose-500/20' },
  cyan: { badge: 'text-cyan-600 bg-cyan-50 border-cyan-200', border: 'border-cyan-500/20' },
  indigo: { badge: 'text-indigo-600 bg-indigo-50 border-indigo-200', border: 'border-indigo-500/20' },
  slate: { badge: 'text-slate-500 bg-slate-50 border-slate-200', border: 'border-slate-300 border-dashed' },
};

export default function SavedNodesListView() {
  const [nodeTypes, setNodeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = () => {
    const sub = getActiveSubdomain() || 'default';
    fetch(`${GO_API_BASE}/nodes?subdomain=${encodeURIComponent(sub)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.data)) {
          const formattedData = data.data.map(n => {
            let colorName = n.category === 'source' ? 'blue' : 'emerald';
            if (n.sub_type === 'kafka' || n.sub_type === 's3') colorName = 'amber';
            if (n.sub_type === 'webhook') colorName = 'purple';
            if (n.sub_type === 'redis') colorName = 'rose';
            if (n.sub_type === 'snowflake') colorName = 'cyan';
            if (n.sub_type === 'pinecone') colorName = 'indigo';
            
            return { ...n, colorName };
          });
          setNodeTypes(formattedData);
        }
      })
      .catch((err) => console.error('Failed to load nodes catalog:', err))
      .finally(() => setLoading(false));
  };

  const [showConfirmModal, setShowConfirmModal] = useState({ show: false, nodeId: null, connectors: [] });

  const handleToggleActive = (nodeId, currentStatus, force = false) => {
    const sub = getActiveSubdomain() || 'default';
    let url = `${GO_API_BASE}/nodes/${nodeId}/toggle?subdomain=${encodeURIComponent(sub)}`;
    if (force) url += `&force=true`;

    fetch(url, {
      method: 'POST'
    })
      .then(async res => {
        if (res.status === 409) {
          const data = await res.json();
          setShowConfirmModal({
            show: true,
            nodeId,
            connectors: data.connectors || []
          });
          return;
        }
        return res.json();
      })
      .then(data => {
        if (!data) return; // Handled by 409 block
        if (data.success) {
          showSuccess(`Node marked as ${data.is_active ? 'Active' : 'Inactive'}`, "Status Updated");
          setNodeTypes(prev => prev.map(n => n.id === nodeId ? { ...n, is_active: data.is_active } : n));
        } else {
          showError("Failed to update node status");
        }
      })
      .catch(err => {
        console.error(err);
        showError("Network error while toggling status");
      });
  };

  const confirmDeactivate = () => {
    if (showConfirmModal.nodeId) {
      handleToggleActive(showConfirmModal.nodeId, true, true);
    }
    setShowConfirmModal({ show: false, nodeId: null, connectors: [] });
  };

  const handleAddNode = (e) => {
    e.preventDefault();
    setShowAddModal(false);
    showSuccess("New custom node driver registered successfully!", "Node Added");
  };

  const sourceNodes = nodeTypes.filter(n => n.category === 'source');
  const destNodes = nodeTypes.filter(n => n.category === 'destination');

  const NodeGrid = ({ nodes, title }) => (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => {
          const IconComp = ICON_MAP[node.sub_type] || Database;
          const colors = node.is_active ? (COLOR_MAP[node.colorName] || COLOR_MAP.blue) : COLOR_MAP.slate;
          
          return (
            <div key={node.id || node.node_key} className={`bg-white rounded-2xl p-5 border flex flex-col justify-between transition-all ${node.is_active ? 'shadow-sm ' + colors.border : 'opacity-60 grayscale-[50%] ' + colors.border}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors.badge}`}>
                  <IconComp size={20} />
                </div>
                <button 
                  onClick={() => handleToggleActive(node.id, node.is_active)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                    node.is_active 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {node.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {node.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
              <div>
                <h3 className={`font-bold truncate ${node.is_active ? 'text-slate-900' : 'text-slate-500'}`}>{node.name}</h3>
                <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1.5">
                  <Terminal size={12} className="text-slate-400" />
                  {node.sub_type} driver
                </div>
              </div>
            </div>
          );
        })}
        {nodes.length === 0 && <div className="text-sm text-slate-400 italic">No nodes found in this category.</div>}
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 w-full space-y-8 animate-in fade-in zoom-in-95 duration-300 relative h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Server className="w-6 h-6 text-[#f95716]" />
            Node Integration Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your Source and Destination integrations. Toggle Active to enable them in the Workflow Builder.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Node
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white border border-slate-200/60 rounded-3xl">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 mt-4">Loading nodes library...</p>
        </div>
      ) : (
        <div className="space-y-10">
          <NodeGrid nodes={sourceNodes} title="Source Integrations" />
          <NodeGrid nodes={destNodes} title="Destination Integrations" />
        </div>
      )}

      {/* Add New Node Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Register Custom Node</h3>
              <p className="text-xs text-slate-500 mt-1">Add a new integration driver to the system.</p>
            </div>
            <form onSubmit={handleAddNode} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Node Name</label>
                <input required type="text" placeholder="e.g. Firebase Cloud Firestore" className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
                  <select className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option value="source">Source</option>
                    <option value="destination">Destination</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Driver Type</label>
                  <input required type="text" placeholder="e.g. firestore" className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
                </div>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors">
                  Save Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-rose-100 bg-rose-50">
              <h3 className="text-lg font-bold text-rose-900">Warning: Node in Use</h3>
            </div>
            <div className="p-6 space-y-4 text-slate-700 text-sm">
              <p>
                This node is currently active and used in the following connectors:
              </p>
              <ul className="list-disc pl-5 font-bold text-slate-900">
                {showConfirmModal.connectors.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
              <p>
                We can't deactivate it for the new connector gracefully. Deactivating this will affect those running connectors. 
                Are you sure you want to force deactivate it?
              </p>
            </div>
            <div className="p-6 pt-0 flex items-center justify-end gap-3">
              <button onClick={() => setShowConfirmModal({ show: false, nodeId: null, connectors: [] })} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeactivate} className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors">
                Force Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
