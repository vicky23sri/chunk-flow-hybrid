import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { showSuccess, showError } from '../utils/toast';
import { 
  Building2, FolderGit2, HardDrive, ShieldCheck, Plus, Trash2, Lock, 
  RefreshCw, FileText, CheckCircle2, Activity, Database, ExternalLink, 
  Layers, Users, Sparkles, Terminal, AlertCircle, Check, Copy, ArrowRight,
  Projector, Clock, Settings, Plug, LayoutDashboard, ChevronRight, Cpu, LogOut,
  ChevronDown, BarChart3, Radio, PanelLeftClose, PanelLeftOpen, ChevronLeft, ChevronRight as ChevronRightIcon,
  Menu, X
} from 'lucide-react';

import WorkflowBuilder from '../components/tenant/WorkflowBuilder';
import BackupScheduler from '../components/tenant/BackupScheduler';
import SnapshotExplorer from '../components/tenant/SnapshotExplorer';
import ConnectionSettingsModal from '../components/tenant/ConnectionSettingsModal';

export default function Dashboard({ user, tenant, onTenantChange }) {
  const [projects, setProjects] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [bucketPrefix, setBucketPrefix] = useState('');
  const [rlsInfo, setRlsInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation active section: 'overview', 'workflow', 'scheduler', 'snapshots', 'projects', 's3', 'security'
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedDSN, setCopiedDSN] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [projData, docData, rlsData] = await Promise.all([
        api.getProjects(),
        api.getDocuments(),
        api.getRLSStatus(),
      ]);

      if (Array.isArray(projData)) setProjects(projData);
      if (docData && docData.documents) {
        setDocuments(docData.documents);
        setBucketPrefix(docData.bucket_prefix);
      }
      if (rlsInfo) setRlsInfo(rlsData);
    } catch (err) {
      const msg = err.message || 'Failed to load tenant dashboard data.';
      setError(msg);
      showError(msg, 'Dashboard Error');
    } finally {
      setLoading(false);
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

  const copyConnectionDSN = () => {
    const dsn = `postgres://virat:vignesh98@localhost:5432/chunkflow_tenant_${tenant?.subdomain || 'acme'}`;
    navigator.clipboard.writeText(dsn);
    setCopiedDSN(true);
    showSuccess('PostgreSQL connection string copied to clipboard!', 'DSN Copied');
    setTimeout(() => setCopiedDSN(false), 2000);
  };

  const handleNavSelect = (sectionId) => {
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

  const sidebarNav = [
    {
      group: 'WORKSPACE OVERVIEW',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'workflow', label: 'Workflow Builder', icon: Projector, badge: 'Canvas' },
      ],
    },
    {
      group: 'BACKUP & PIPELINES',
      items: [
        { id: 'scheduler', label: 'Backup Scheduler', icon: Clock, badge: 'Cron' },
        { id: 'snapshots', label: 'Snapshots & Vault', icon: Database, badge: '24' },
      ],
    },
    {
      group: 'STORAGE & SECURITY',
      items: [
        { id: 'projects', label: 'Projects', icon: FolderGit2, count: projects.length },
        { id: 's3', label: 'S3 Storage', icon: HardDrive, count: documents.length },
        { id: 'security', label: 'Security & Isolation', icon: ShieldCheck, badge: '100%' },
      ],
    },
  ];

  const activeItem = sidebarNav.flatMap((g) => g.items).find((i) => i.id === activeSection);

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#f8fafc] text-slate-900 flex flex-row text-left font-sans relative">
      
      {/* ── MOBILE / TABLET BACKDROP OVERLAY WHEN EXPANDED ───────────────────── */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 top-[65px] bg-slate-950/50 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-200"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* ── UNIFIED SIDEBAR NAVIGATION (MOBILE, TABLET & DESKTOP) ─────────────── */}
      <aside 
        className={`bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 z-40 transition-all duration-300 ease-in-out h-[calc(100vh-65px)] sticky top-[65px] ${
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
              <div className="w-9 h-9 rounded-xl bg-[#f95716] text-white flex items-center justify-center font-black text-base shadow-sm shadow-orange-500/20 shrink-0">
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
              {/* <button
                onClick={copyConnectionDSN}
                className="w-full py-2 px-3 rounded-xl bg-white border border-slate-200 hover:border-orange-500/50 text-slate-700 font-mono text-[11px] font-bold flex items-center justify-between cursor-pointer transition-all shadow-xs"
              >
                <span className="flex items-center gap-1.5 text-xs font-sans text-slate-900">
                  <Lock size={13} className="text-[#f95716]" /> DSN
                </span>
                <span className={`text-[10px] font-bold ${copiedDSN ? 'text-emerald-600' : 'text-[#f95716]'}`}>
                  {copiedDSN ? 'Copied!' : 'Copy DSN'}
                </span>
              </button> */}

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
              {/* <button
                onClick={copyConnectionDSN}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:border-orange-500 text-slate-700 transition-all cursor-pointer shadow-xs"
                title="Copy Database DSN"
              >
                <Lock size={16} className="text-[#f95716]" />
              </button> */}

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
      <main className="flex-1 p-4 sm:p-5 md:p-6 space-y-6 overflow-y-auto flex flex-col min-h-[calc(100vh-65px)]">
        
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ── SECTION: OVERVIEW DASHBOARD ───────────────────────────────────── */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            
            {/* Main Banner */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-xs relative overflow-hidden flex flex-wrap justify-between items-center gap-6">
              <div className="relative z-10 text-left max-w-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-mono font-bold bg-orange-50 text-[#f95716] border border-orange-200">
                    PHYSICAL ISOLATION ACTIVE
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Dedicated PostgreSQL
                  </span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  {tenant?.name || 'Tenant Workspace Dashboard'}
                </h1>

                {/* <div className="text-xs text-slate-500 font-normal flex gap-6 flex-wrap mt-3 font-mono">
                  <span>Target DB: <code className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-bold">chunkflow_tenant_{tenant?.subdomain}</code></span>
                  <span>Tenant UUID: <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">{tenant?.id}</code></span>
                </div> */}
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-xs space-y-2 relative z-10 shrink-0 w-full sm:w-auto min-w-[280px] shadow-xs">
                <div className="font-mono font-bold text-[#f95716] flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5">
                    <Lock size={14} /> Connection DSN
                  </span>
                  <button 
                    onClick={copyConnectionDSN}
                    className="text-[11px] text-slate-500 hover:text-slate-900 font-bold cursor-pointer"
                  >
                    {copiedDSN ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <code className="font-mono text-[11px] text-sky-600 font-semibold bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 block break-all">
                  postgres://localhost:5432/chunkflow_tenant_{tenant?.subdomain}
                </code>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-left hover:border-orange-500/40 transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Active Projects</span>
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#f95716] flex items-center justify-center">
                    <FolderGit2 size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-950 leading-none mb-2">{projects.length}</div>
                <div className="text-xs text-slate-500 font-normal">
                  Database table: <code className="font-mono text-slate-700 font-bold">projects</code>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-left hover:border-sky-500/40 transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">S3 Objects Stored</span>
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <HardDrive size={18} />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-950 leading-none mb-2">{documents.length}</div>
                <div className="text-xs text-slate-500 font-normal">
                  Storage volume: <strong className="text-sky-600 font-mono font-bold">{totalStorageMB} MB</strong>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-left hover:border-emerald-500/40 transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Isolation Status</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600 leading-none mb-2">100% Isolated</div>
                <div className="text-xs text-slate-500 font-normal">
                  Dedicated PostgreSQL DB instance
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs text-left hover:border-amber-500/40 transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">FastCDC Engine</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Activity size={18} />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600 leading-none mb-2">Active • 4.8x</div>
                <div className="text-xs text-slate-500 font-normal">
                  Variable Content-Defined Slicer
                </div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div 
                onClick={() => setActiveSection('workflow')}
                className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-orange-500/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#f95716] flex items-center justify-center border border-orange-200 shrink-0">
                    <Projector size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">Launch Workflow Builder</h3>
                    <p className="text-xs text-slate-500">Visual database-to-storage canvas pipeline</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </div>

              <div 
                onClick={() => setActiveSection('scheduler')}
                className="bg-white border border-slate-200 p-6 rounded-3xl hover:border-purple-500/50 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200 shrink-0">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900">Configure Backup Scheduler</h3>
                    <p className="text-xs text-slate-500">Cron rules and FastCDC snapshot telemetry</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-400" />
              </div>
            </div>

          </div>
        )}

        {/* ── SECTION: WORKFLOW BUILDER ───────────────────────────────── */}
        {activeSection === 'workflow' && (
          <WorkflowBuilder tenant={tenant} />
        )}

        {/* ── SECTION: BACKUP SCHEDULER ───────────────────────────────── */}
        {activeSection === 'scheduler' && (
          <BackupScheduler tenant={tenant} />
        )}

        {/* ── SECTION: SNAPSHOTS EXPLORER ─────────────────────────────── */}
        {activeSection === 'snapshots' && (
          <SnapshotExplorer tenant={tenant} />
        )}

        {/* ── SECTION: PROJECTS ───────────────────────────────────────── */}
        {activeSection === 'projects' && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs text-left">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">Tenant Workspace Projects</h2>
                <p className="text-xs text-slate-500 mt-1 font-normal">
                  Executed inside <code className="font-mono bg-orange-50 text-[#f95716] px-1.5 py-0.5 rounded border border-orange-200 font-bold">chunkflow_tenant_{tenant?.subdomain}.projects</code>
                </p>
              </div>
              <button 
                className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#f95716] hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2" 
                onClick={() => setShowProjectModal(true)}
              >
                <Plus size={16} />
                <span>New Project</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {projects.length === 0 ? (
                <div className="col-span-full py-16 px-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#f95716] flex items-center justify-center mb-4 border border-orange-200 shadow-xs">
                    <FolderGit2 size={26} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">
                    No Tenant Projects Found
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-6 font-normal">
                    Create your first isolated project workspace inside dedicated PostgreSQL database <code className="font-mono bg-slate-100 text-slate-700 px-1 py-0.5 rounded border border-slate-200">chunkflow_tenant_{tenant?.subdomain}</code>.
                  </p>
                  <button
                    onClick={() => setShowProjectModal(true)}
                    className="px-6 py-2.5 rounded-full bg-[#f95716] text-white font-bold text-xs uppercase tracking-wider hover:bg-orange-600 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Create Project Now</span>
                  </button>
                </div>
              ) : (
                projects.map((proj) => (
                  <div key={proj.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md hover:border-[#f95716]/40 transition-all text-left">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-black text-lg text-slate-950">{proj.name}</h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">{proj.status}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {proj.description || 'No description provided for this tenant project.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <div className="text-[11px] text-slate-400 font-mono">
                        ID: {proj.id.slice(0, 14)}...
                      </div>
                      <button 
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer" 
                        onClick={() => handleDeleteProject(proj.id)}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── SECTION: S3 PARTITION OBJECTS ───────────────────────────── */}
        {activeSection === 's3' && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs text-left">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight">Tenant S3 Partition Objects</h2>
                <p className="text-xs text-slate-500 mt-1 font-normal">
                  Multi-tenant isolated storage bucket key structure
                </p>
              </div>
              <button 
                className="px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer flex items-center gap-2" 
                onClick={() => setShowDocModal(true)}
              >
                <Plus size={15} /> Log S3 Object
              </button>
            </div>

            <div className="bg-sky-50 border border-sky-200/80 p-4 rounded-2xl mb-6 text-xs text-sky-700 font-mono font-bold flex items-center gap-3">
              <HardDrive size={18} className="text-sky-600 shrink-0" />
              <span>Partition Prefix: s3://chunkflow-raw/tenant/{tenant?.id}/data/</span>
            </div>

            <div className="flex flex-col gap-3.5">
              {documents.length === 0 ? (
                <div className="py-14 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300 font-normal text-xs">
                  No storage objects logged in this tenant partition.
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="bg-white border border-slate-200/80 rounded-2xl px-6 py-4 flex justify-between items-center shadow-xs hover:border-sky-500/40 hover:shadow-md transition-all">
                    <div>
                      <div className="font-bold text-sm text-slate-950 flex items-center gap-2">
                        <FileText size={16} className="text-sky-500" />
                        {doc.name}
                      </div>
                      <div className="text-xs mt-1.5 text-slate-500 font-mono">
                        S3 Key: <code className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200 font-bold">{doc.s3_key}</code>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-50 text-sky-600 border border-sky-200">
                        {(doc.size_bytes / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── SECTION: SECURITY ISOLATION AUDIT ───────────────────────── */}
        {activeSection === 'security' && (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xs text-left">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-2.5">
                  <ShieldCheck size={24} className="text-emerald-500" />
                  Database Physical Isolation Audit
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-normal">
                  Verification metrics provided by backend endpoint <code className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-bold">/api/v1/rls-status</code>
                </p>
              </div>
              <button 
                className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer flex items-center gap-2" 
                onClick={loadDashboardData}
              >
                <RefreshCw size={14} /> Re-verify Audit
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Current Database Target
                </div>
                <div className="text-lg font-black text-indigo-600 font-mono bg-indigo-50 inline-block px-3 py-1.5 rounded-xl border border-indigo-200">
                  {rlsInfo?.database || `chunkflow_tenant_${tenant?.subdomain}`}
                </div>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed font-normal">
                  Each request is routed by Go middleware to a dedicated PostgreSQL database with zero shared tables.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
                <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Schema & Scope Level
                </div>
                <div className="text-lg font-black text-emerald-600 font-mono bg-emerald-50 inline-block px-3 py-1.5 rounded-xl border border-emerald-200">
                  {rlsInfo?.schema || 'public (Dedicated DB)'}
                </div>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed font-normal">
                  Full physical database isolation guarantees complete immunity to SQL injection cross-tenant leakage.
                </p>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Project Creation Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative overflow-hidden w-full max-w-md text-left animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-950 mb-4">
              Create Tenant Project
            </h3>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase font-mono">Project Name</label>
                <input 
                  type="text" 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#f95716] focus:bg-white shadow-xs font-medium" 
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)} 
                  required 
                  placeholder="e.g. Real-Time Data Pipeline" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase font-mono">Description</label>
                <textarea 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#f95716] focus:bg-white shadow-xs font-medium resize-y" 
                  rows={3} 
                  value={projectDesc} 
                  onChange={(e) => setProjectDesc(e.target.value)} 
                  placeholder="Describe project goals..." 
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  className="px-5 py-2.5 text-xs font-bold rounded-full text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer" 
                  onClick={() => setShowProjectModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 text-xs font-bold rounded-full text-white bg-[#f95716] hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doc Creation Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl relative overflow-hidden w-full max-w-md text-left animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-950 mb-4">
              Log S3 Partition Object
            </h3>
            <form onSubmit={handleCreateDoc} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase font-mono">File Name</label>
                <input 
                  type="text" 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#f95716] focus:bg-white shadow-xs font-medium" 
                  value={docName} 
                  onChange={(e) => setDocName(e.target.value)} 
                  required 
                  placeholder="e.g. analytics_q3_raw.parquet" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase font-mono">Size (Bytes)</label>
                <input 
                  type="number" 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#f95716] focus:bg-white shadow-xs font-medium" 
                  value={docSize} 
                  onChange={(e) => setDocSize(e.target.value)} 
                  required 
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  className="px-5 py-2.5 text-xs font-bold rounded-full text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer" 
                  onClick={() => setShowDocModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 text-xs font-bold rounded-full text-white bg-[#f95716] hover:bg-orange-600 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  Log Storage Object
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
