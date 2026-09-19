import React, { useState, useEffect } from 'react';
import { api, setAuthSession } from '../services/api';
import { showError } from '../utils/toast';
import {
  Building2, Crown, Lock, Globe, ArrowRight,
  Eye, EyeOff, ArrowLeft, Database, ShieldCheck,
  Mail, Sparkles, Server, Cpu, CheckCircle2
} from 'lucide-react';

// ─── Domain Login (willsparrow.localhost:5173) ───────────────────────────────
function TenantDomainLogin({ subdomain, onSuccess }) {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setAuthSession(res.token, res.user, res.tenant, false);
      if (onSuccess) onSuccess(res.user, res.tenant);
    } catch (err) {
      const msg = err.message || 'Invalid credentials. Please try again.';
      setError(msg);
      showError(msg, `Workspace Sign In Failed (${subdomain})`);
    } finally {
      setLoading(false);
    }
  };

  const initial = subdomain?.[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-[calc(100vh-130px)] flex items-center justify-center p-4 sm:p-8 bg-slate-50/70 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Soft Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-200/40 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-purple-200/40 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left branding panel — Crisp Light Indigo Gradient */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle overlay shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tenant Workspace Domain
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {initial}
              </div>
              <div>
                <h1 className="text-2xl font-black text-white capitalize">{subdomain}</h1>
                <p className="text-xs text-indigo-200 font-mono">{subdomain}.localhost</p>
              </div>
            </div>

            <p className="text-indigo-100 text-xs leading-relaxed mb-6">
              Dedicated multi-tenant workspace with physical database isolation.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Database size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-indigo-200 font-medium">Isolated Database</div>
                  <div className="text-xs font-mono font-bold text-white">chunkflow_tenant_{subdomain}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Globe size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-indigo-200 font-medium">Domain Context</div>
                  <div className="text-xs font-mono font-bold text-white">{subdomain}.localhost:5173</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/20 text-[11px] text-indigo-200 flex items-center justify-between mt-6">
            <span>Data Boundary</span>
            <span className="font-semibold text-white flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-300" /> 100% Isolated
            </span>
          </div>
        </div>

        {/* Right form panel — Clean Light Theme */}
        <div className="lg:col-span-7 p-8 lg:p-10 bg-white flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Workspace Sign In</h2>
            <p className="text-xs text-slate-500">
              Sign in to access your <strong className="text-indigo-600 font-semibold">{subdomain}</strong> workspace.
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="tenant-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="tenant-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-indigo-50/70 border border-indigo-100 rounded-xl px-3.5 py-2.5">
              <Lock size={13} className="text-indigo-500 shrink-0" />
              <span className="text-xs text-indigo-700 font-medium">
                Domain locked to <strong className="font-mono text-indigo-900">{subdomain}.localhost</strong>
              </span>
            </div>

            <button
              id="tenant-login-btn"
              type="submit"
              className="w-full py-3 px-4 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-105 shadow-md shadow-indigo-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-1"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <>Sign In to Workspace <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Central Login (localhost:5173) — Super Admin ONLY ───────────────────────
function CentralLogin({ onSuperAdminSuccess, onNavigateHome, initialEmail, initialPassword }) {
  const [email, setEmail]               = useState(initialEmail || '');
  const [password, setPassword]         = useState(initialPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (initialEmail)    setEmail(initialEmail);
    if (initialPassword) setPassword(initialPassword);
  }, [initialEmail, initialPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.superAdminLogin({ email, password });
      setAuthSession(res.token, res.super_admin, null, true);
      if (onSuperAdminSuccess) onSuperAdminSuccess(res.super_admin);
    } catch (err) {
      const msg = err.message || 'Invalid credentials. Please try again.';
      setError(msg);
      showError(msg, 'Central Admin Login Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail('admin@chunkflow.com');
    setPassword('password');
  };

  return (
    <div className="min-h-[calc(100vh-130px)] flex items-center justify-center p-4 sm:p-8 bg-slate-50/70 selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-200/50 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[350px] bg-indigo-200/50 blur-[110px] rounded-full pointer-events-none" />

      <div className="w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left side: Premium Control Center Feature Showcase — Light Purple/Indigo Gradient */}
        <div className="lg:col-span-5 bg-gradient-to-br from-purple-700 via-indigo-700 to-slate-900 text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-6">
              <Crown size={14} className="text-yellow-300" />
              <span>Central Control Board</span>
            </div>

            <h1 className="text-2xl font-black text-white leading-tight mb-3 tracking-tight">
              Multi-Tenant<br />
              <span className="text-yellow-300">
                System Operations
              </span>
            </h1>

            <p className="text-purple-100 text-xs leading-relaxed mb-6">
              Root administrative control for tenant database provisioning, domain mappings, and system operations.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Database size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-purple-200 font-medium">Central DB Target</div>
                  <div className="text-xs font-mono font-bold text-white">chunkflow_central</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Globe size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-purple-200 font-medium">Tenancy Strategy</div>
                  <div className="text-xs font-mono font-bold text-white">Domain-Based (Stancl)</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Server size={16} />
                </div>
                <div>
                  <div className="text-[10px] text-purple-200 font-medium">System Telemetry</div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    All Systems Operational
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/20 text-[11px] text-purple-200 flex items-center justify-between mt-6">
            <span>System Privileges</span>
            <span className="font-mono text-[10px] text-yellow-300 font-bold px-2.5 py-0.5 rounded bg-white/15 border border-white/20">
              SUPER_ADMIN
            </span>
          </div>
        </div>

        {/* Right side: Clean Light Form */}
        <div className="lg:col-span-7 p-8 lg:p-10 bg-white flex flex-col justify-center">
          {onNavigateHome && (
            <div className="mb-4">
              <button
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all cursor-pointer"
                onClick={onNavigateHome}
              >
                <ArrowLeft size={13} /> Back to Home
              </button>
            </div>
          )}

          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold mb-3">
              <Crown size={12} className="text-purple-600" /> Super Admin Access
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Super Admin Sign In</h2>
            <p className="text-xs text-slate-500">
              Sign in with root administrator credentials to manage tenants and registries.
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admin Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-xs"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@chunkflow.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-xs"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-0 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Quick Fill Helper */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-slate-500 text-[11px]">Testing credentials?</span>
              <button
                type="button"
                onClick={handleQuickFillAdmin}
                className="text-purple-600 hover:text-purple-700 font-semibold cursor-pointer underline flex items-center gap-1 bg-transparent border-0 text-[11px]"
              >
                <Sparkles size={12} /> Auto-fill Admin
              </button>
            </div>

            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-sm font-bold rounded-xl text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:brightness-105 shadow-md shadow-purple-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Authenticating System Admin...
                </span>
              ) : (
                <>Access Control Board <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500">
              Target Central DB: <code className="font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-semibold">chunkflow_central</code>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Tenant users sign in at their domain (e.g. <span className="font-mono text-slate-600">willsparrow.localhost:5173</span>)
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Main Export — routes to the right login based on context ─────────────
export default function Login({ onSuccess, onSuperAdminSuccess, onSwitchToRegister, onNavigateHome, initialSubdomain, initialEmail, initialPassword, initialIsSuperAdmin, domainLocked, domainSubdomain }) {
  if (domainLocked && domainSubdomain) {
    return (
      <TenantDomainLogin
        subdomain={domainSubdomain}
        onSuccess={onSuccess}
        onSwitchToRegister={onSwitchToRegister}
      />
    );
  }

  return (
    <CentralLogin
      onSuccess={onSuccess}
      onSuperAdminSuccess={onSuperAdminSuccess}
      onSwitchToRegister={onSwitchToRegister}
      onNavigateHome={onNavigateHome}
      initialSubdomain={initialSubdomain}
      initialEmail={initialEmail}
      initialPassword={initialPassword}
      initialIsSuperAdmin={initialIsSuperAdmin}
    />
  );
}
