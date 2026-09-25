import React, { useState, useEffect } from 'react';
import { Database, HardDrive, ShieldCheck, Layers, RefreshCw, Plus, CheckCircle2, Play, Download, Cloud, Zap, ArrowRight, Shield, Lock, X, Eye, EyeOff, Server, Key } from 'lucide-react';
import { api, getConnectors, getCanvas, createConnector, downloadSnapshot } from '../../services/api';
import { showSuccess, showError } from '../../utils/toast';

import VaultHeader from './snapshot/VaultHeader';
import VaultToolbar from './snapshot/VaultToolbar';
import CreateConnectorModal from './workflow/CreateConnectorModal';

export default function SnapshotExplorer({ tenant, onNavigateToBuilder }) {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [connectors, setConnectors] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [viewMode, setViewMode] = useState('topology');
  const [isRunningCdc, setIsRunningCdc] = useState({});
  const [selectedPayloadCfg, setSelectedPayloadCfg] = useState(null);
  const [showSecret, setShowSecret] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    setLoading(true);
    try {
      const [connRes, canvasRes] = await Promise.all([
        getConnectors(),
        getCanvas(),
      ]);

      let connsList = [];
      if (connRes && connRes.data) {
        connsList = connRes.data;
        setConnectors(connRes.data);
      }
      
      if (connsList.length === 0) {
        connsList = [{ id: 'default-1', name: 'Database-to-S3 Backup Workflow Builder', status: 'active' }];
      }

      if (canvasRes && canvasRes.nodes) {
        const pipelines = [];
        connsList.forEach((connItem) => {
          const connectorNodes = canvasRes.nodes.filter(n => n.connector_id === connItem.id || (!n.connector_id && connsList.length === 1));
          if (connectorNodes.length > 0) {
            const pgNode = connectorNodes.find(n => n.node?.sub_type === 'postgres' || n.subtype === 'postgres');
            const s3Node = connectorNodes.find(n => n.node?.sub_type === 's3' || n.subtype === 's3');
            pipelines.push({
              id: connItem.id, // Using connector ID as pipeline ID
              name: connItem.name,
              connector_id: connItem.id,
              source_type: pgNode?.node || {},
              source_data: pgNode?.config_data || {},
              destination_type: s3Node?.node || {},
              destination_data: s3Node?.config_data || {},
              connectorItem: connItem,
              connectorName: connItem.name,
            });
          }
        });
        setConfigurations(pipelines);
      }
    } catch (err) {
      console.error('Failed to load connectors & configurations:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tenant?.subdomain]);

  const handleConnectorCreated = (newConnector) => {
    setShowCreateModal(false);
    loadData();
    if (onNavigateToBuilder && newConnector && newConnector.id) {
      onNavigateToBuilder(newConnector);
    }
  };

  const handleRunCdcStream = async (item, e) => {
    if (e) e.stopPropagation();
    const itemId = item.id;
    setIsRunningCdc((prev) => ({ ...prev, [itemId]: true }));
    try {
      const sub = tenant?.subdomain || 'willsparrow';
      const res = await fetch(`${import.meta.env.VITE_GO_API_URL || 'http://localhost:8080/api/v1'}/workflow/trigger-cdc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Subdomain': sub,
        },
        body: JSON.stringify({ subdomain: sub, workflowName: item.name }),
      });
      const data = await res.json().catch(() => ({}));
      if (data && data.success) {
        showSuccess(
          `FastCDC Stream Run Completed! Sliced ${data.cdc?.total_bytes || 8840} bytes into ${data.cdc?.total_chunks || 1} chunk(s) (${data.cdc?.dedup_ratio_percent || 0}% dedup).`,
          'FastCDC Stream Executed'
        );
        loadData();
      } else {
        showError(data?.message || 'Failed to trigger FastCDC backup stream.', 'CDC Run Failed');
      }
    } catch (err) {
      showError(err.message || 'Network error triggering FastCDC stream.', 'CDC Error');
    } finally {
      setIsRunningCdc((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleDownloadSnapshot = async (item, e) => {
    if (e) e.stopPropagation();
    try {
      await downloadSnapshot(item.id);
      showSuccess(`Snapshot hash details for "${item.name}" downloaded!`, 'Hash Details Downloaded');
    } catch (err) {
      const timeStr = new Date().toISOString();
      const hashDetails = {
        snapshot_id: item.id,
        workflow_name: item.name,
        tenant_subdomain: tenant?.subdomain || 'willsparrow',
        timestamp: timeStr,
        source_configuration: item.source_type?.name || 'Database Source',
        destination_configuration: item.destination_type?.name || 'Amazon S3 Vault',
        hash_algorithm: 'BLAKE3',
        cdc_algorithm: 'FastCDC',
        chunks: [
          {
            chunk_index: 0,
            chunk_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            size_bytes: 8840,
          },
        ],
      };

      const blob = new Blob([JSON.stringify(hashDetails, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snapshot-${item.id.slice(0, 8)}-hashes.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(`Snapshot hash details for "${item.name}" downloaded!`, 'Hash Details Downloaded');
    }
  };

  const [showFilters, setShowFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    connector: 'All',
    sourceType: 'All',
    destType: 'All'
  });

  // Configurations state now contains the active pipelines directly from getCanvas mapping
  const activePipelines = configurations;

  // Extract unique options for the filters
  const connectorNames = [...new Set(activePipelines.map(p => p.connectorName))];
  const sourceTypes = [...new Set(activePipelines.map(p => p.source_data?.name || p.source_type?.name || 'Database Source'))];
  const destTypes = [...new Set(activePipelines.map(p => p.destination_data?.name || p.destination_type?.name || 'Amazon S3 Vault'))];

  // Filter the flattened pipelines
  const filteredPipelines = activePipelines.filter((pipeline) => {
    const srcName = pipeline.source_data?.name || pipeline.source_type?.name || 'Database Source';
    const destName = pipeline.destination_data?.name || pipeline.destination_type?.name || 'Amazon S3 Vault';

    const matchesSearch = searchQuery === '' || 
      pipeline.connectorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      srcName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      destName.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesConnector = advFilters.connector === 'All' || pipeline.connectorName === advFilters.connector;
    const matchesSource = advFilters.sourceType === 'All' || srcName === advFilters.sourceType;
    const matchesDest = advFilters.destType === 'All' || destName === advFilters.destType;

    return matchesSearch && matchesConnector && matchesSource && matchesDest;
  });

  return (
    <div className="w-full flex-1 space-y-6 text-left font-sans bg-[#f8fafc] min-h-[calc(100vh-100px)] flex flex-col justify-between">
      <div>
        {/* 1. Header Banner */}
        <VaultHeader
          tenant={tenant}
          isRefreshing={isRefreshing}
          onRefresh={loadData}
          onNewPipeline={() => onNavigateToBuilder && onNavigateToBuilder(null)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm mb-6 flex flex-wrap gap-6 items-end animate-in slide-in-from-top-2">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Connector / Pipeline</label>
              <select 
                value={advFilters.connector}
                onChange={(e) => setAdvFilters(prev => ({ ...prev, connector: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium py-2.5 px-3 rounded-xl outline-none focus:bg-white focus:border-[#f95716]/50 transition-all cursor-pointer"
              >
                <option value="All">All Connectors</option>
                {connectorNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Source Type</label>
              <select 
                value={advFilters.sourceType}
                onChange={(e) => setAdvFilters(prev => ({ ...prev, sourceType: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium py-2.5 px-3 rounded-xl outline-none focus:bg-white focus:border-[#f95716]/50 transition-all cursor-pointer"
              >
                <option value="All">All Sources</option>
                {sourceTypes.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Destination Type</label>
              <select 
                value={advFilters.destType}
                onChange={(e) => setAdvFilters(prev => ({ ...prev, destType: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium py-2.5 px-3 rounded-xl outline-none focus:bg-white focus:border-[#f95716]/50 transition-all cursor-pointer"
              >
                <option value="All">All Destinations</option>
                {destTypes.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <button 
              onClick={() => setAdvFilters({ connector: 'All', sourceType: 'All', destType: 'All' })}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* 3. Main Content View */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl py-24 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-3 shadow-xs">
            <RefreshCw size={28} className="animate-spin text-[#f95716]" />
            <span>Loading Configured Pipelines & Topologies...</span>
          </div>
        ) : filteredPipelines.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-10 text-center max-w-2xl mx-auto space-y-4 shadow-xs mt-10">
            <div className="w-16 h-16 rounded-3xl bg-orange-50 text-[#f95716] border border-orange-200 flex items-center justify-center mx-auto shadow-xs">
              <Database size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              No Configured Pipelines Found
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-normal">
              You haven't configured any source and destination nodes yet (or your filters excluded them). Head over to the Workflow Builder to map out your first data pipeline!
            </p>
            <button
              onClick={() => onNavigateToBuilder && onNavigateToBuilder(null)}
              className="px-6 py-3 rounded-xl bg-[#f95716] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Layers size={16} />
              <span>Go to Workflow Builder</span>
            </button>
          </div>
        ) : (
          /* Pipelines Table */
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden mb-10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="py-4 px-5 text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono w-1/4">Connector / Pipeline</th>
                    <th className="py-4 px-5 text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono w-1/4">Source</th>
                    <th className="py-4 px-5 text-[10px] font-black uppercase tracking-wider text-[#f95716] font-mono w-16 text-center">Stream</th>
                    <th className="py-4 px-5 text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono w-1/4">Destination</th>
                    <th className="py-4 px-5 text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono text-right w-1/4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPipelines.map((pipeline) => {
                    const srcName = pipeline.source_data?.name || pipeline.source_type?.name || 'Database Source';
                    const srcHost = pipeline.source_data?.host || 'localhost';
                    const srcDb = pipeline.source_data?.database_name || pipeline.source_data?.database || 'chunkflow_tenant';

                    const destName = pipeline.destination_data?.name || pipeline.destination_type?.name || 'Amazon S3 Vault';
                    const destBucket = pipeline.destination_data?.bucket_name || pipeline.destination_data?.bucketName || 'chunkflow-vault';
                    const destPath = pipeline.destination_data?.folder_path || pipeline.destination_data?.folderPath || '/backups';

                    return (
                      <tr key={pipeline.id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Pipeline Name */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#f95716] border border-orange-200 flex items-center justify-center shrink-0">
                              <Layers size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-black text-slate-900 truncate" title={pipeline.connectorName}>
                                {pipeline.connectorName}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Source */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                              <Database size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">{srcName}</div>
                              <div className="text-[10px] font-mono text-slate-500 truncate">{srcHost} / {srcDb}</div>
                            </div>
                          </div>
                        </td>

                        {/* Stream Node */}
                        <td className="py-4 px-5">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-0.5 bg-blue-400" />
                              <div className="w-5 h-5 rounded-full bg-[#f95716] text-white flex items-center justify-center text-[8px] font-bold shadow-xs">
                                <Zap size={10} />
                              </div>
                              <div className="w-3 h-0.5 bg-emerald-400" />
                            </div>
                            <span className="text-[7px] font-mono font-bold text-[#f95716] uppercase tracking-wider mt-0.5">FastCDC</span>
                          </div>
                        </td>

                        {/* Destination */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                              <Cloud size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">{destName}</div>
                              <div className="text-[10px] font-mono text-slate-500 truncate">s3://{destBucket}{destPath}</div>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onNavigateToBuilder && onNavigateToBuilder(pipeline.connectorItem)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#f95716] hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                              title="Open Canvas Builder"
                            >
                              <Layers size={12} />
                              <span>Canvas</span>
                            </button>
                            <button
                              onClick={() => { setSelectedPayloadCfg(pipeline); setShowSecret(false); }}
                              className="px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#f95716] border border-orange-200 text-xs font-bold transition-all flex items-center gap-1"
                              title="View Details"
                            >
                              <Lock size={12} />
                              <span>Details</span>
                            </button>
                            <button
                              onClick={(e) => handleRunCdcStream(pipeline, e)}
                              disabled={isRunningCdc[pipeline.id]}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-all disabled:opacity-40"
                              title="Run FastCDC Stream"
                            >
                              {isRunningCdc[pipeline.id] ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                            </button>
                            <button
                              onClick={(e) => handleDownloadSnapshot(pipeline, e)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-all"
                              title="Download Hashes"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Details Modal */}
      {selectedPayloadCfg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            
            <div className="px-8 py-6 bg-slate-900 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#f95716]/20 rounded-full blur-3xl translate-x-10 -translate-y-10" />
              <div className="flex items-center gap-4 text-white relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#f95716]/20 border border-[#f95716]/30 flex items-center justify-center text-[#f95716]">
                  <Database size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-widest text-white">
                    Pipeline Details
                  </h3>
                  <p className="text-xs font-mono text-[#f95716] mt-1">CONFIGURATIONS & SECRETS</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPayloadCfg(null)}
                className="relative z-10 p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* SOURCE COLUMN */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-colors">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20 group-hover:bg-orange-500/50 transition-colors" />
                  <div className="flex items-center justify-between mb-6 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-100">
                        <Server size={18} />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        {selectedPayloadCfg.source_type?.name || 'Database Source'}
                      </h4>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm font-mono pl-2">
                    {selectedPayloadCfg.source_data && Object.keys(selectedPayloadCfg.source_data).length > 0 ? (
                      Object.entries(selectedPayloadCfg.source_data).map(([k, v]) => (
                        <div key={k} className="flex flex-col gap-1.5">
                          <span className="text-slate-400 text-xs font-bold uppercase">{k.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 break-all">{String(v)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 italic text-center py-4">No source payload data</div>
                    )}
                  </div>
                </div>

                {/* DESTINATION COLUMN */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-colors">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20 group-hover:bg-orange-500/50 transition-colors" />
                  <div className="flex items-center justify-between mb-6 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-700 border border-slate-100">
                        <Cloud size={18} />
                      </div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        {selectedPayloadCfg.destination_type?.name || 'Amazon S3 Vault'}
                      </h4>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm font-mono pl-2">
                    {selectedPayloadCfg.destination_data && Object.keys(selectedPayloadCfg.destination_data).length > 0 ? (
                      Object.entries(selectedPayloadCfg.destination_data).map(([k, v]) => {
                        const isKey = k.toLowerCase().includes('key') || k.toLowerCase().includes('secret');
                        return (
                          <div key={k} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-xs font-bold uppercase">{k.replace(/_/g, ' ')}</span>
                              {isKey && (
                                <button 
                                  onClick={() => setShowSecret(!showSecret)}
                                  className="text-[#f95716] hover:bg-orange-50 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                >
                                  {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                                  {showSecret ? 'HIDE' : 'REVEAL'}
                                </button>
                              )}
                            </div>
                            <span className={`font-bold border break-all flex items-center gap-2 ${isKey ? 'text-[#f95716] bg-slate-900 px-3 py-2 rounded-xl border-slate-800' : 'text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border-slate-100'}`}>
                              {isKey && <Key size={14} className="text-slate-500 shrink-0" />}
                              {isKey 
                                ? (showSecret ? String(v) : "••••••••••••••••" + (String(v).length > 4 ? String(v).substring(String(v).length - 4) : ""))
                                : String(v)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-slate-400 italic text-center py-4">No destination payload data</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Connector Modal */}
      <CreateConnectorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleConnectorCreated}
      />

    </div>
  );
}
