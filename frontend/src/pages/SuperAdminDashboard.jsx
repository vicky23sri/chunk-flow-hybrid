import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { showSuccess, showError } from '../utils/toast';
import { 
  Crown, Database, Globe, Users, Plus, Building2, ShieldCheck, 
  Terminal, Activity, RefreshCw, AlertCircle, ExternalLink, FolderGit2
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Provision Tenant Modal State
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getSuperAdminDashboard();
      setData(res);
    } catch (err) {
      const msg = err.message || 'Failed to load Super Admin dashboard';
      setError(msg);
      showError(msg, 'Control Plane Error');
    } finally {
      setLoading(false);
    }
  };

  const handleProvisionTenant = async (e) => {
    e.preventDefault();
    try {
      await api.registerTenant({
        tenant_name: tenantName,
        subdomain,
        admin_email: adminEmail,
        admin_password: adminPassword,
      });

      showSuccess(`Tenant '${tenantName}' & physical database 'chunkflow_tenant_${subdomain}' provisioned successfully!`, 'Workspace Provisioned');
      setTenantName('');
      setSubdomain('');
      setAdminEmail('');
      setAdminPassword('');
      setShowProvisionModal(false);
      loadDashboard();
    } catch (err) {
      showError(err.message || 'Failed to provision tenant.', 'Provisioning Failed');
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1536px] mx-auto px-8 mt-20 text-center text-slate-500">
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[0.85rem] font-bold tracking-wide mb-3.5 bg-purple-50 text-purple-600 border border-purple-200 pulse-animation">
          <Crown size={15} /> System Super Admin Control Plane
        </div>
        <p className="text-slate-500 text-[0.95rem]">
          Fetching central board metrics & dedicated tenant database registry...
        </p>
      </div>
    );
  }

  const status = data?.system_status || {};
  const tenants = data?.tenants || [];
  const domains = data?.domains || [];

  return (
    <div className="w-full max-w-[1536px] mx-auto px-8 mt-7 pb-16 flex flex-col gap-6">
      
      {/* 1. Header Banner */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl p-7 shadow-xl relative overflow-hidden flex flex-wrap justify-between items-center transition-all hover:border-purple-500/40">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[1.9rem] font-extrabold text-slate-900 flex items-center gap-2.5">
              <Crown size={26} className="text-violet-600" />
              Central System Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-purple-50 text-purple-600 border border-purple-200">Super Admin Scope</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-200">Central DB: {status.central_db_name}</span>
          </div>
          <p className="text-[0.88rem] text-slate-500 mt-1">
            System-wide physical database registry, active tenants, and Stancl domain mappings.
          </p>
        </div>

        <button 
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[0.92rem] font-semibold rounded-xl text-white bg-gradient-to-r from-[#f95716] to-orange-600 hover:brightness-105 shadow-md shadow-orange-500/25 transition-all cursor-pointer mt-4 lg:mt-0" 
          onClick={() => setShowProvisionModal(true)}
        >
          <Plus size={16} /> Provision Tenant Workspace
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-500 px-4 py-3.5 rounded-xl flex items-center gap-2.5 font-medium">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. System Board Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:border-orange-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.75rem] text-slate-500 uppercase font-bold tracking-wide">Total Organizations</span>
            <Building2 size={18} className="text-orange-500" />
          </div>
          <div className="text-[2.3rem] font-extrabold text-[#f95716] leading-none">
            {status.total_tenants}
          </div>
          <div className="text-[0.78rem] text-slate-500 mt-2">
            Registered Tenant Entries
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.75rem] text-slate-500 uppercase font-bold tracking-wide">Dedicated DB Instances</span>
            <Database size={18} className="text-amber-500" />
          </div>
          <div className="text-[2.3rem] font-extrabold text-amber-500 leading-none">
            {status.total_databases}
          </div>
          <div className="text-[0.78rem] text-slate-500 mt-2">
            Isolated PostgreSQL Databases
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:border-emerald-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.75rem] text-slate-500 uppercase font-bold tracking-wide">Domain Mappings</span>
            <Globe size={18} className="text-emerald-400" />
          </div>
          <div className="text-[2.3rem] font-extrabold text-emerald-400 leading-none">
            {status.total_domains}
          </div>
          <div className="text-[0.78rem] text-slate-500 mt-2">
            Portiq Host Mappings
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[0.75rem] text-slate-500 uppercase font-bold tracking-wide">Global System Users</span>
            <Users size={18} className="text-amber-400" />
          </div>
          <div className="text-[2.3rem] font-extrabold text-amber-400 leading-none">
            {status.total_system_users}
          </div>
          <div className="text-[0.78rem] text-slate-500 mt-2">
            Across all physical databases
          </div>
        </div>
      </div>

      {/* 3. Tenant Directory & Database Registry Table */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-7 shadow-sm transition-all">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[1.3rem] font-extrabold text-slate-900 flex items-center gap-2">
            <Database size={18} className="text-[#f95716]" />
            Tenants Directory & Database Registry
          </h2>
          <button 
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[0.82rem] font-semibold rounded-xl text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all cursor-pointer" 
            onClick={loadDashboard}
          >
            <RefreshCw size={13} /> Refresh Registry
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.88rem]">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-500 text-[0.72rem] uppercase font-bold">
                <th className="p-3.5">Organization</th>
                <th className="p-3.5">Subdomain</th>
                <th className="p-3.5">Dedicated Database</th>
                <th className="p-3.5">Mapped Domains</th>
                <th className="p-3.5">Metrics</th>
                <th className="p-3.5">Created Date</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((item) => (
                <tr key={item.tenant.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-[#f95716]" />
                      {item.tenant.name}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide bg-orange-50 text-orange-600 border border-orange-200">{item.tenant.subdomain}</span>
                  </td>
                  <td className="p-3.5">
                    <code className="font-mono bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded border border-sky-100 text-xs font-semibold">{item.tenant.db_name}</code>
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {item.domains.map((dom) => (
                        <a
                          key={dom}
                          href={`http://${dom}:5173`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.7rem] font-bold tracking-wide bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 hover:border-sky-400 hover:text-sky-700 transition-all cursor-pointer no-underline"
                          title={`Open ${dom} in new tab`}
                        >
                          {dom}
                          <ExternalLink size={9} className="shrink-0 opacity-70" />
                        </a>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-500 text-[0.82rem]">
                    <div className="flex items-center gap-1.5"><Users size={12} /> {item.user_count} Users</div>
                    <div className="flex items-center gap-1.5 mt-0.5"><FolderGit2 size={12} /> {item.project_count} Projects</div>
                  </td>
                  <td className="p-3.5 text-slate-400 text-[0.8rem]">
                    {new Date(item.tenant.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Central Domains Registry */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-7 shadow-sm transition-all">
        <h2 className="text-[1.3rem] font-extrabold text-slate-900 mb-4.5 flex items-center gap-2">
          <Globe size={18} className="text-emerald-500" />
          Central Domain Registry (<code className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 text-[0.85rem] font-semibold">chunkflow_central.domains</code>)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {domains.map((d) => (
            <a
              key={d.id}
              href={`http://${d.domain}:5173`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm hover:border-orange-400 hover:bg-orange-50/30 transition-all no-underline group"
            >
              <div>
                <div className="font-bold text-[#f95716] text-[0.9rem] font-mono flex items-center gap-1.5 group-hover:text-orange-700">
                  🌐 {d.domain}
                  <ExternalLink size={11} className="shrink-0 opacity-60" />
                </div>
                <div className="text-[0.72rem] text-slate-400 mt-1">
                  Tenant FK: <code className="font-mono text-[0.68rem]">{d.tenant_id.slice(0, 18)}...</code>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-bold tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-200">ACTIVE</span>
            </a>
          ))}
        </div>
      </div>

      {/* Provision Tenant Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-[12px] flex items-center justify-center z-50 p-5">
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[24px] p-8 shadow-2xl relative overflow-hidden w-[480px] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-[1.3rem] font-extrabold text-slate-900 mb-4.5 flex items-center gap-2">
              <Plus size={18} className="text-[#f95716]" />
              Provision Dedicated Tenant DB
            </h3>
            <form onSubmit={handleProvisionTenant} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-semibold text-slate-900">Organization Name</label>
                <input
                  type="text"
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[0.92rem] text-slate-900 outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-sm"
                  value={tenantName}
                  onChange={(e) => {
                    setTenantName(e.target.value);
                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                  }}
                  placeholder="e.g. Cyberdyne Systems"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-semibold text-slate-900">Tenant Subdomain</label>
                <input
                  type="text"
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[0.92rem] text-slate-900 outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-sm"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="cyberdyne"
                  required
                />
                <div className="text-[0.72rem] text-slate-500 mt-1">
                  Target Physical DB: <code className="font-mono bg-slate-100 text-slate-700 px-1 py-0.5 rounded border border-slate-200 font-semibold">chunkflow_tenant_{subdomain || '...'}</code>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-semibold text-slate-900">Admin Email</label>
                <input
                  type="email"
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[0.92rem] text-slate-900 outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-sm"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@cyberdyne.com"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.85rem] font-semibold text-slate-900">Admin Password</label>
                <input
                  type="password"
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[0.92rem] text-slate-900 outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-sm"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 mt-4">
                <button 
                  type="button" 
                  className="inline-flex items-center justify-center px-4 py-2 text-[0.82rem] font-semibold rounded-xl text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer" 
                  onClick={() => setShowProvisionModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="inline-flex items-center justify-center px-4 py-2 text-[0.82rem] font-semibold rounded-xl text-white bg-gradient-to-r from-[#f95716] to-orange-600 hover:brightness-105 shadow-md shadow-orange-500/25 transition-all cursor-pointer"
                >
                  Provision Physical DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
