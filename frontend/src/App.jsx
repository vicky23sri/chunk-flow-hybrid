import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Login from './pages/Login';
import RegisterTenant from './pages/RegisterTenant';
import { api, getToken, clearAuthSession, isSuperAdminSession, getDomainBasedSubdomain, setActiveSubdomain } from './services/api';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { showSuccess, showError, showInfo } from './utils/toast';

// ─── Domain Detection ─────────────────────────────────────────────────────
// Computed once at module load — never changes during a page session
const domainSubdomain = getDomainBasedSubdomain(); // e.g. 'willsparrow' or null
const isDomainBased = !!domainSubdomain;

function AppContent() {

  const [user, setUser]           = useState(null);
  const [tenant, setTenant]       = useState(null);
  const [superAdmin, setSuperAdmin] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentPage, setCurrentPage]   = useState('loading');
  const [loading, setLoading]     = useState(true);

  // Pre-fill props for quick-login from landing page
  const [loginProps, setLoginProps] = useState({
    subdomain: domainSubdomain || '',
    email: '',
    password: '',
    isSuperAdmin: false,
  });

  useEffect(() => {
    // Store subdomain from URL so API calls use correct DB
    if (domainSubdomain) {
      setActiveSubdomain(domainSubdomain);
    }
    checkAuthSession();
  }, []);

  // ─── Session Restoration ───────────────────────────────────────────────
  const checkAuthSession = async () => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      setCurrentPage('home');
      return;
    }

    // Super Admin sessions are stored with a flag — restore from localStorage
    if (!isDomainBased && isSuperAdminSession()) {
      const stored = localStorage.getItem('user');
      setSuperAdmin(stored ? JSON.parse(stored) : null);
      setIsSuperAdmin(true);
      setCurrentPage('superadmin');
      setLoading(false);
      return;
    }

    // For domain-based: try to restore tenant from localStorage first (fast path)
    // then verify token is still valid via API
    if (isDomainBased) {
      const storedUser   = localStorage.getItem('user');
      const storedTenant = localStorage.getItem('tenant');
      if (storedUser && storedTenant) {
        const parsedUser   = JSON.parse(storedUser);
        const parsedTenant = JSON.parse(storedTenant);
        // Quick restore — still verify token in background
        setUser(parsedUser);
        setTenant(parsedTenant);
        setCurrentPage('dashboard');
        setLoading(false);
        // Async token validation (silently logout if expired)
        api.getMe().catch((err) => {
          clearAuthSession();
          setUser(null);
          setTenant(null);
          setCurrentPage('home');
          showError(err.message || 'Session expired. Please sign in again.', 'Session Expired');
        });
        return;
      }
    }

    // Normal path: call getMe() to restore session
    try {
      const data = await api.getMe();
      if (data.user && data.tenant) {
        setUser(data.user);
        setTenant(data.tenant);
        setIsSuperAdmin(false);
        setCurrentPage('dashboard');
      } else {
        // Tenant info missing — force re-login
        clearAuthSession();
        setCurrentPage('home');
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err.message);
      clearAuthSession();
      setUser(null);
      setTenant(null);
      setSuperAdmin(null);
      setIsSuperAdmin(false);
      setCurrentPage('home');
      showError(err.message || 'Session expired. Please sign in again.', 'Session Expired');
    } finally {
      setLoading(false);
    }
  };

  // ─── Auth Handlers & Navigation ──────────────────────────────────────────
  const handleAuthSuccess = (u, t) => {
    setUser(u);
    setTenant(t);
    setIsSuperAdmin(false);
    setSuperAdmin(null);
    setCurrentPage('dashboard');
    showSuccess(`Welcome back, ${u.name || u.email}!`, 'Signed In');
  };

  const handleSuperAdminSuccess = (admin) => {
    setSuperAdmin(admin);
    setIsSuperAdmin(true);
    setUser(null);
    setTenant(null);
    setCurrentPage('superadmin');
    showSuccess('Super Admin control session authorized.', 'Central Admin');
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setTenant(null);
    setSuperAdmin(null);
    setIsSuperAdmin(false);
    setCurrentPage('home');
    showInfo('You have signed out.', 'Signed Out');
  };

  const handleTenantChange = () => {
    checkAuthSession();
  };

  const redirectLoggedInUser = () => {
    if (isSuperAdmin || superAdmin) {
      setCurrentPage('superadmin');
      return true;
    }
    if (user) {
      setCurrentPage('dashboard');
      return true;
    }
    return false;
  };

  const handleNavigateLogin = () => {
    if (redirectLoggedInUser()) return;
    setCurrentPage('login');
  };

  const handleNavigateRegister = () => {
    if (redirectLoggedInUser()) return;
    if (isDomainBased) {
      const centralHost = window.location.host.split('.').slice(1).join('.') || window.location.host;
      window.location.href = `${window.location.protocol}//${centralHost}`;
    } else {
      setCurrentPage('register');
    }
  };

  const handleQuickLogin = (sub, email, pwd, isSuper = false) => {
    if (redirectLoggedInUser()) return;
    setLoginProps({ subdomain: sub, email, password: pwd, isSuperAdmin: isSuper });
    setCurrentPage('login');
  };

  // ─── Loading Screen ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center flex-col gap-4 bg-slate-50">
        {isDomainBased ? (
          <>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
              <span className="text-white text-xl font-black">
                {domainSubdomain?.[0]?.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm">
              Connecting to <strong className="text-indigo-600">{domainSubdomain}</strong> workspace...
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-purple-50 text-purple-600 border border-purple-200 animate-pulse">
              ChunkFlow Platform
            </div>
            <p className="text-slate-500 font-medium text-sm">Initializing session & database routing...</p>
          </>
        )}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header
        user={user}
        tenant={tenant}
        superAdmin={superAdmin}
        isSuperAdmin={isSuperAdmin}
        isDomainBased={isDomainBased}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
        onTenantChange={handleTenantChange}
      />

      <main className="flex-1">
        {/* Landing page — shown on home for central or tenant domain */}
        {currentPage === 'home' && (
          <LandingPage
            user={user}
            superAdmin={superAdmin}
            isSuperAdmin={isSuperAdmin}
            onNavigateLogin={handleNavigateLogin}
            onNavigateRegister={handleNavigateRegister}
            onQuickLogin={handleQuickLogin}
          />
        )}

        {/* Super Admin dashboard — central only */}
        {currentPage === 'superadmin' && isSuperAdmin && !isDomainBased && (
          <SuperAdminDashboard />
        )}

        {/* Tenant Dashboard */}
        {currentPage === 'dashboard' && user && (
          <Dashboard user={user} tenant={tenant} onTenantChange={handleTenantChange} />
        )}

        {/* Login: TenantDomainLogin if on tenant domain URL, CentralLogin if on central domain */}
        {(currentPage === 'login' || (currentPage === 'dashboard' && !user)) && (
          <Login
            onSuccess={handleAuthSuccess}
            onSuperAdminSuccess={handleSuperAdminSuccess}
            onSwitchToRegister={() => setCurrentPage('register')}
            onNavigateHome={() => setCurrentPage('home')}
            initialSubdomain={loginProps.subdomain || domainSubdomain || ''}
            initialEmail={loginProps.email}
            initialPassword={loginProps.password}
            initialIsSuperAdmin={loginProps.isSuperAdmin}
            domainLocked={isDomainBased}
            domainSubdomain={domainSubdomain}
          />
        )}

        {/* Register — central only */}
        {currentPage === 'register' && !isDomainBased && (
          <RegisterTenant
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setCurrentPage('login')}
          />
        )}
      </main>

      {/* {currentPage !== 'home' && (
        <footer className="border-t border-slate-200 py-5 text-center text-slate-400 text-xs bg-white">
          {isDomainBased ? (
            <span>
              <strong className="text-indigo-500">{domainSubdomain}</strong>.localhost &nbsp;•&nbsp;
              DB: <code className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">chunkflow_tenant_{domainSubdomain}</code>
            </span>
          ) : (
            <span>
              ChunkFlow SaaS &nbsp;•&nbsp;
              Central DB: <code className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">chunkflow_central</code>
            </span>
          )}
        </footer>
      )} */}
    </div>
  );
}

export default function App() {
  return (
    <>
      <AppContent />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}
