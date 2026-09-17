import React, { useState } from 'react';
import { api, setAuthSession } from '../services/api';
import { Building2, UserPlus, ArrowRight, ShieldCheck, Sparkles, Database, Globe, CheckCircle2, Lock, Mail } from 'lucide-react';

export default function RegisterTenant({ onSuccess, onSwitchToLogin }) {
  const [tenantName, setTenantName] = useState('');
  const [subdomain, setSubdomain]     = useState('');
  const [adminEmail, setAdminEmail]   = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSubdomainAutoFill = (name) => {
    setTenantName(name);
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    setSubdomain(slug);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.registerTenant({
        tenant_name: tenantName,
        subdomain,
        admin_email: adminEmail,
        admin_password: adminPassword,
      });

      setAuthSession(res.token, res.user, res.tenant);
      if (onSuccess) {
        onSuccess(res.user, res.tenant);
      }
    } catch (err) {
      setError(err.message || 'Tenant registration failed. Subdomain may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-130px)] flex items-center justify-center p-4 sm:p-8 bg-slate-50/70 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Soft Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-200/50 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[350px] bg-purple-200/50 blur-[110px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left branding panel — Indigo/Purple Gradient */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle overlay shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-6">
              <Sparkles size={14} className="text-yellow-300" />
              <span>Multi-Tenant Onboarding</span>
            </div>

            <h1 className="text-2xl font-black text-white leading-tight mb-3 tracking-tight">
              Provision New<br />
              <span className="text-yellow-300">
                Tenant Workspace
              </span>
            </h1>

            <p className="text-indigo-100 text-xs leading-relaxed mb-6">
              Instant dynamic PostgreSQL database creation with automated domain routing and isolated credentials.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Database size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-indigo-200 font-medium">Automated Physical DB</div>
                  <div className="text-xs font-mono font-bold text-white">chunkflow_tenant_...</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Globe size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-indigo-200 font-medium">Dedicated Subdomain</div>
                  <div className="text-xs font-mono font-bold text-white">&lt;subdomain&gt;.localhost</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-indigo-200 font-medium">Isolation Guarantee</div>
                  <div className="text-xs font-bold text-emerald-300">Zero Cross-Tenant Data Leakage</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/20 text-[11px] text-indigo-200 flex items-center justify-between mt-6">
            <span>Automated Provisioning</span>
            <span className="font-semibold text-white flex items-center gap-1">
              <CheckCircle2 size={13} className="text-emerald-300" /> Ready
            </span>
          </div>
        </div>

        {/* Right side: Registration Form */}
        <div className="lg:col-span-7 p-8 lg:p-10 bg-white flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Register Organization</h2>
            <p className="text-xs text-slate-500">
              Create a new tenant workspace with isolated PostgreSQL database storage.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs mb-5 font-medium flex items-center gap-2.5">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Organization Name</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                  value={tenantName}
                  onChange={(e) => handleSubdomainAutoFill(e.target.value)}
                  placeholder="e.g. Globex Corporation"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tenant Subdomain</label>
              <div className="flex items-center">
                <input
                  type="text"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-l-xl px-4 py-2.5 text-sm font-bold text-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="globex"
                  required
                />
                <span className="bg-slate-100 border border-l-0 border-slate-200 rounded-r-xl px-3.5 py-2.5 text-xs text-slate-500 font-mono font-medium">
                  .localhost
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                <span>Target DB:</span>
                <code className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 text-[11px] font-semibold">
                  chunkflow_tenant_{subdomain || '...'}
                </code>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@globex.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admin Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-105 shadow-md shadow-indigo-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Provisioning Tenant DB...
                </span>
              ) : (
                <>Provision Tenant Workspace <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an active tenant workspace?{' '}
            <span
              className="text-indigo-600 font-bold cursor-pointer underline hover:text-indigo-700"
              onClick={onSwitchToLogin}
            >
              Sign In
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
