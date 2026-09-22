import React, { useState } from 'react';
import { Home, Building2, Crown, LogOut, Cpu, User, UserPlus, Menu, X, Sparkles, ShieldCheck } from 'lucide-react';

export default function Header({ user, superAdmin, isSuperAdmin, isDomainBased, onLogout, currentPage, setCurrentPage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    handleNavClick('home');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all text-slate-900 shadow-xs">
      <div className={`${['home', 'login', 'register'].includes(currentPage) ? 'max-w-7xl mx-auto' : 'w-full'} px-3`}>
        <div className="flex items-center justify-between h-16 gap-6">
          
          {/* Left: Brand & Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group shrink-0" 
            onClick={handleLogoClick}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f95716] via-orange-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Cpu size={22} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900 leading-none">
                  ChunkFlow
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase leading-none border ${
                  isSuperAdmin ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}>
                  {isSuperAdmin ? 'Control Plane' : 'SaaS Engine'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-1 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isDomainBased ? 'Tenant Isolated' : 'System Active'}</span>
              </div>
            </div>
          </div>

          {/* Middle: Navigation Links */}
          {(user || isSuperAdmin) && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
              {user && (
                <button
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === 'dashboard' 
                      ? 'bg-white text-[#f95716] shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  onClick={() => handleNavClick('dashboard')}
                >
                  <Building2 size={14} />
                  <span>Workspace</span>
                </button>
              )}

              {isSuperAdmin && (
                <button
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === 'superadmin' 
                      ? 'bg-white text-orange-600 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  onClick={() => handleNavClick('superadmin')}
                >
                  <Crown size={14} className={currentPage === 'superadmin' ? 'text-orange-600' : 'text-slate-400'} />
                  <span>Super Admin</span>
                </button>
              )}
            </nav>
          )}

          {/* Right: User / Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isSuperAdmin && superAdmin ? (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                  <Crown size={14} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{superAdmin.email}</div>
                  <div className="text-[10px] font-extrabold text-orange-700 uppercase leading-none">Super Admin</div>
                </div>
                <button 
                  className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" 
                  onClick={onLogout}
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : user ? (
              <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-[#f95716] text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user.email?.[0] || 'U'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{user.email}</div>
                  <div className="text-[10px] font-extrabold text-orange-700 uppercase leading-none">{user.role || 'User'}</div>
                </div>
                <button 
                  className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" 
                  onClick={onLogout}
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === 'login' 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  onClick={() => handleNavClick('login')}
                >
                  <User size={14} />
                  <span>{isDomainBased ? 'Sign In' : 'Super Admin Sign In'}</span>
                </button>
                {!isDomainBased && (
                  <button
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === 'register' 
                        ? 'bg-[#f95716] text-white shadow-md shadow-orange-600/20' 
                        : 'bg-[#f95716] hover:bg-orange-600 text-white shadow-sm'
                    }`}
                    onClick={() => handleNavClick('register')}
                  >
                    <UserPlus size={14} />
                    <span>Register Tenant</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>
      </div>

      {/* Collapsible Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3">
          <nav className="flex flex-col gap-1.5">
            {user && (
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  currentPage === 'dashboard' ? 'bg-orange-50 text-[#f95716] font-extrabold' : 'text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => handleNavClick('dashboard')}
              >
                <Building2 size={16} /> Workspace Dashboard
              </button>
            )}

            {isSuperAdmin && (
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  currentPage === 'superadmin' ? 'bg-amber-50 text-orange-700 font-extrabold' : 'text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => handleNavClick('superadmin')}
              >
                <Crown size={16} /> Super Admin Control
              </button>
            )}
          </nav>

          <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
            {!user && !superAdmin ? (
              <>
                <button
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 text-white flex items-center justify-center gap-2"
                  onClick={() => handleNavClick('login')}
                >
                  <User size={15} /> {isDomainBased ? 'Sign In' : 'Super Admin Sign In'}
                </button>
                {!isDomainBased && (
                  <button
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#f95716] text-white flex items-center justify-center gap-2"
                    onClick={() => handleNavClick('register')}
                  >
                    <UserPlus size={15} /> Register Tenant
                  </button>
                )}
              </>
            ) : (
              <button
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center justify-center gap-2"
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut size={15} /> Logout ({superAdmin?.email || user?.email})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
