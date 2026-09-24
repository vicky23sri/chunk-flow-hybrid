import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { showSuccess, showError } from '../utils/toast';
import { 
  Building2, FolderGit2, HardDrive, ShieldCheck, Plus, Trash2, Lock, 
  RefreshCw, FileText, CheckCircle2, Activity, Database, ExternalLink, 
  Layers, Users, Sparkles, Terminal, AlertCircle, Check, Copy, ArrowRight,
  Projector, Clock, Settings, Plug, LayoutDashboard, ChevronRight, Cpu, LogOut,
  ChevronDown, BarChart3, Radio, PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight as ChevronRightIcon,
  Menu, X, Server
} from 'lucide-react';

import WorkflowBuilder from '../components/tenant/WorkflowBuilder';
import ConnectorSelectionView from '../components/tenant/workflow/ConnectorSelectionView';
import BackupScheduler from '../components/tenant/BackupScheduler';
import SnapshotExplorer from '../components/tenant/SnapshotExplorer';
import SnapshotHistoryView from '../components/tenant/snapshot/SnapshotHistoryView';
import ConnectionSettingsModal from '../components/tenant/ConnectionSettingsModal';

// Overview Components
import OverviewBanner from '../components/tenant/overview/OverviewBanner';
import MetricCards from '../components/tenant/overview/MetricCards';
import ActivityFeed from '../components/tenant/overview/ActivityFeed';
import ConnectorsList from '../components/tenant/overview/ConnectorsList';
import RecentWorkflows from '../components/tenant/overview/RecentWorkflows';
import QuickActions from '../components/tenant/overview/QuickActions';
import SavedNodesListView from '../components/tenant/SavedNodesListView';

export default function Dashboard({ user, tenant, onTenantChange }) {
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [bucketPrefix, setBucketPrefix] = useState('');
  const [rlsInfo, setRlsInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation active section: 'overview', 'workflow', 'scheduler', 'snapshots', 'projects', 's3', 'security'
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [copiedDSN, setCopiedDSN] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleNavigateToBuilder = (wf = null) => {
    const targetWf = (wf && typeof wf === 'object' && typeof wf.id === 'string') ? wf : null;
    setSelectedWorkflow(targetWf);
    setActiveSection(targetWf ? 'workflow_canvas' : 'workflow');
  };

  // Sidebar Collapse / Expand State (Auto-collapsed on mobile & tablet)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    typeof window !== 'undefined' && window.innerWidth < 1024
  );

  // Modals / Form inputs
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');

  const [showDocModal, setShowDocModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docSize, setDocSize] = useState('1048576');

  useEffect(() => {
    loadDashboardData();

    // Auto handle window resize for mobile & tablet responsive behavior
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [tenant?.id]);

  const [snapshotCount, setSnapshotCount] = useState(0);
  const [connectorsCount, setConnectorsCount] = useState(0);
  const [connectors, setConnectors] = useState([]);
  const [cdcSnapshotsCount, setCdcSnapshotsCount] = useState(0);
  const [allSnapshots, setAllSnapshots] = useState([]);
  const [totalChunkSize, setTotalChunkSize] = useState('0 B');
  const [recentWorkflows, setRecentWorkflows] = useState([]);

  const loadDashboardData = async (isInitial = true) => {
    if (isInitial) setLoading(true);
    setError('');
    try {
      const [wfRes, connectorsRes, cdcRes, sizeRes] = await Promise.all([
        api.getWorkflows(),
        api.getConnectors(),
        api.listSnapshots(),
        api.getChunkSize()
      ]);
      
      if (wfRes && Array.isArray(wfRes.workflows)) {
        setSnapshotCount(wfRes.workflows.length);
        setRecentWorkflows(wfRes.workflows.slice(0, 5));
      }
      if (connectorsRes && connectorsRes.success) {
        setConnectorsCount(connectorsRes.data?.length || 0);
        setConnectors(connectorsRes.data || []);
      }
      if (Array.isArray(cdcRes)) {
        setCdcSnapshotsCount(cdcRes.length);
        setAllSnapshots(cdcRes);
      }
      if (sizeRes && sizeRes.physical_size_bytes !== undefined) {
        const bytes = sizeRes.physical_size_bytes;
        setTotalChunkSize(bytes > 1024*1024 ? (bytes/(1024*1024)).toFixed(2) + ' MB' : bytes + ' B');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const newProj = await api.createProject({
        name: projectName,
        description: projectDesc,
      });
      setProjects([newProj, ...projects]);
      setProjectName('');
      setProjectDesc('');
      setShowProjectModal(false);
      showSuccess(`Project "${newProj.name || projectName}" created successfully!`, 'Project Created');
    } catch (err) {
      showError(err.message || 'Failed to create project.', 'Create Project Failed');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await api.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      showSuccess('Project deleted successfully.', 'Project Deleted');
    } catch (err) {
      showError(err.message || 'Failed to delete project.', 'Delete Project Failed');
    }
  };

  const handleCreateDoc = async (e) => {
    e.preventDefault();
    try {
      const newDoc = await api.createDocument({
        name: docName,
        size_bytes: parseInt(docSize, 10) || 1024,
      });
      setDocuments([newDoc, ...documents]);
      setDocName('');
      setShowDocModal(false);
      showSuccess(`Storage object "${newDoc.name || docName}" logged successfully!`, 'S3 Object Logged');
    } catch (err) {
      showError(err.message || 'Failed to log storage object.', 'S3 Logging Failed');
    }
  };

  const handleNavSelect = (sectionId) => {
    setSelectedWorkflow(null);
    setActiveSection(sectionId);
    // On tablet & mobile (<1024px), collapse sidebar after selecting item
    if (window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-65px)] bg-[#f8fafc] flex items-center justify-center p-6 text-slate-500">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm text-center max-w-md">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#f95716] flex items-center justify-center mx-auto mb-4 border border-orange-200 shadow-sm animate-bounce">
            <Database size={22} />
          </div>
          <h3 className="text-base font-black text-slate-900 mb-1">
            Connecting to Dedicated Tenant DB
          </h3>
          <p className="text-xs text-slate-500 font-normal">
            Initializing GORM connection pool for <code className="font-mono bg-orange-50 text-[#f95716] px-1.5 py-0.5 rounded border border-orange-200 font-bold">chunkflow_tenant_{tenant?.subdomain || '...'}</code>
          </p>
        </div>
      </div>
    );
  }

  const totalStorageMB = (documents.reduce((acc, d) => acc + (d.size_bytes || 0), 0) / 1024 / 1024).toFixed(2);

  const activePipelinesCount = connectors.filter(c => c.is_configured).length;

  const sidebarNav = [
    {
      group: 'WORKSPACE OVERVIEW',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'workflow', label: 'Workflow Builder', icon: Projector, badge: 'Canvas' },
        { id: 'nodes_list', label: 'Nodes List', icon: Server },
      ],
    },
    {
      group: 'BACKUP & PIPELINES',
      items: [
        { id: 'snapshots', label: 'Active Pipelines', icon: Database, badge: activePipelinesCount > 0 ? String(activePipelinesCount) : null },
        { id: 'history_snapshots', label: 'CDC Snapshots', icon: FileText, badge: 'master.csv' },
        // { id: 'scheduler', label: 'Backup Scheduler', icon: Clock, badge: 'Cron' },
      ],
    },
  ];

  const activeItem = sidebarNav.flatMap((g) => g.items).find((i) => i.id === activeSection);

  return (
    <div className="h-full w-full bg-[#f8fafc] text-slate-900 flex flex-row text-left font-sans relative overflow-hidden">
      
      {/* ── MOBILE / TABLET BACKDROP OVERLAY WHEN EXPANDED ───────────────────── */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 top-[65px] bg-slate-950/50 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-200"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* ── UNIFIED SIDEBAR NAVIGATION (MOBILE, TABLET & DESKTOP) ─────────────── */}
      <aside 
        className={`bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 z-40 transition-all duration-300 ease-in-out h-full ${
          isSidebarCollapsed 
            ? 'w-16 lg:w-20 shadow-xs' 
            : 'fixed left-0 top-[65px] bottom-0 w-64 shadow-2xl lg:shadow-xs lg:static lg:w-64'
        }`}
      >
        <div>
          {/* Header: Tenant Badge & Collapse / Expand Toggle */}
          <div className={`p-3.5 border-b border-slate-100 flex items-center justify-between ${
            isSidebarCollapsed ? 'flex-col gap-2.5 items-center' : ''
          }`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[#f95716] text-[#ffffff] flex items-center justify-center font-black text-base shadow-sm shadow-orange-500/20 shrink-0">
                {tenant?.name?.[0] || 'A'}
              </div>

              {!isSidebarCollapsed && (
                <div className="overflow-hidden">
                  <h2 className="font-black text-xs text-slate-900 tracking-tight truncate">
                    {tenant?.name || 'Acme Corporation'}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#f95716] font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="truncate">{tenant?.subdomain}.app.local</span>
                  </div>
                </div>
              )}
            </div>

            {/* Universal Toggle Button (Works on Mobile, Tablet & Desktop) */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRightIcon size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-2 sm:p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-220px)]">
            {sidebarNav.map((group) => (
              <div key={group.group}>
                {!isSidebarCollapsed && (
                  <div className="px-3 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {group.group}
                  </div>
                )}

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const IconComp = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavSelect(item.id)}
                        title={item.label}
                        className={`w-full flex items-center transition-all cursor-pointer ${
                          isSidebarCollapsed 
                            ? 'justify-center p-2.5 rounded-xl' 
                            : 'justify-between px-3 py-2.5 rounded-xl text-xs font-bold'
                        } ${
                          isActive
                            ? 'bg-[#f95716] text-white shadow-md shadow-orange-500/20'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <IconComp size={18} className="shrink-0" />
                          {!isSidebarCollapsed && <span className="text-xs font-bold">{item.label}</span>}
                        </div>

                        {!isSidebarCollapsed && item.badge && (
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20 text-white' : 'bg-orange-50 text-[#f95716] border border-orange-200'
                          }`}>
                            {item.badge}
                          </span>
                        )}

                        {!isSidebarCollapsed && item.count !== undefined && (
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer: Quick DSN Card & Settings */}
        <div className="p-2 sm:p-3 border-t border-slate-100 bg-slate-50/60 space-y-2">
          {!isSidebarCollapsed ? (
            <>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <Settings size={14} className="text-[#f95716]" />
                <span>Connection Settings</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer shadow-xs"
                title="Connection Settings"
              >
                <Settings size={16} className="text-[#f95716]" />
              </button>
            </div>
          )}
        </div>

      </aside>

      {/* ── 2. MAIN WORKSPACE CONTENT AREA ───────────────────────────────────── */}
      <main className="flex-1 h-full overflow-y-auto p-4 sm:p-5 md:p-6 space-y-6 flex flex-col">
        
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ── SECTION: OVERVIEW DASHBOARD ───────────────────────────────────── */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <OverviewBanner tenant={tenant} />
            <MetricCards 
              snapshotCount={snapshotCount}
              connectorsCount={connectorsCount}
              cdcSnapshotsCount={cdcSnapshotsCount}
              totalChunkSize={totalChunkSize}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ActivityFeed snapshots={allSnapshots} />
              <ConnectorsList 
                connectors={connectors} 
                onViewAll={() => setActiveSection('workflow')} 
                onAddConnector={() => {
                  setActiveSection('workflow');
                  // Give it a tick to render ConnectorSelectionView before triggering its modal if needed
                  // Or just navigate to workflow view where they can click New Connector
                }}
              />
            </div>
            <RecentWorkflows 
              recentWorkflows={recentWorkflows} 
              onNavSelect={handleNavSelect} 
              onNavigateToBuilder={handleNavigateToBuilder} 
            />
            <QuickActions 
              onNavigateToBuilder={handleNavigateToBuilder} 
              onNavSelect={handleNavSelect} 
            />
          </div>
        )}

        {/* ── SECTION: WORKFLOW BUILDER ENTRY (CONNECTOR SELECTION) ─────── */}
        {activeSection === 'workflow' && (
          <ConnectorSelectionView 
            connectors={connectors} 
            onSelectConnector={(connector) => {
              setSelectedWorkflow(connector);
              setActiveSection('workflow_canvas');
            }}
            onAddConnector={(newConnector) => {
              loadDashboardData(false);
              if (newConnector && newConnector.id) {
                setSelectedWorkflow(newConnector);
                setActiveSection('workflow_canvas');
              }
            }}
          />
        )}

        {/* ── SECTION: WORKFLOW CANVAS ───────────────────────────────── */}
        {activeSection === 'workflow_canvas' && (
          <WorkflowBuilder 
            key={selectedWorkflow?.id || 'new_workflow'} 
            tenant={tenant} 
            initialWorkflow={selectedWorkflow} 
          />
        )}

        {/* ── SECTION: BACKUP SCHEDULER ───────────────────────────────── */}
        {activeSection === 'scheduler' && (
          <BackupScheduler tenant={tenant} />
        )}

        {/* ── SECTION: SNAPSHOTS EXPLORER (BACKUP VAULT) ─────────────── */}
        {activeSection === 'snapshots' && (
          <SnapshotExplorer 
            tenant={tenant} 
            onNavigateToBuilder={handleNavigateToBuilder}
            onSnapshotChange={() => loadDashboardData(false)}
          />
        )}

        {/* ── SECTION: CDC SNAPSHOTS HISTORY ──────────────────────────── */}
        {activeSection === 'history_snapshots' && (
          <SnapshotHistoryView tenant={tenant} />
        )}

        {/* ── SECTION: SAVED NODES LIST ───────────────────────────────── */}
        {activeSection === 'nodes_list' && (
          <SavedNodesListView onNavigateToBuilder={handleNavigateToBuilder} />
        )}

      </main>

      {/* Connection Credentials Modal */}
      {showSettingsModal && (
        <ConnectionSettingsModal 
          tenant={tenant} 
          onClose={() => setShowSettingsModal(false)}
          onSave={() => loadDashboardData()}
        />
      )}

    </div>
  );
}
