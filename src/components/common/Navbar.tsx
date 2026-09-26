import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, UserCheck, ArrowRight, Menu, X, Package } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentPath, navigate, isAdminLoggedIn } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navLinks = [
    { label: 'Print Portal', path: '/print' },
    { label: 'Track Order', path: '/track' },
    { label: 'Services', path: '/services' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleNav = (p: string) => {
    navigate(p);
    setMobileMenuOpen(false);
  };

  const cleanPath = currentPath.split('?')[0].replace(/\/$/, '') || '/';

  return (
    <header className="sticky top-0 z-40 bg-[#070e1c]/90 backdrop-blur-md border-b border-blue-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => handleNav('/print')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-orange-500/20 group-hover:scale-105 transition">
            <Printer className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                PRINT
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                Merta City
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Print Portal & E-Mitra Services
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive =
              cleanPath === link.path || (link.path === '/print' && cleanPath === '/');
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#112347]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Admin Access & Track Order */}
        <div className="hidden sm:flex items-center gap-2">
          {cleanPath !== '/track' && (
            <button
              onClick={() => handleNav('/track')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-[#112347] hover:bg-[#162c5a] border border-blue-800/40 rounded-xl transition"
            >
              <Package className="w-3.5 h-3.5 text-orange-400" />
              <span>Track Order</span>
            </button>
          )}

          {isAdminLoggedIn ? (
            <button
              onClick={() => handleNav('/admin/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-xl text-xs font-bold transition border border-emerald-500/30"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => handleNav('/admin/login')}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-[#112347] transition"
            >
              Staff / Admin
            </button>
          )}

          {(cleanPath !== '/print' && cleanPath !== '/') && (
            <button
              onClick={() => handleNav('/print')}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white rounded-xl text-xs font-extrabold shadow-md shadow-orange-500/20 transition active:scale-95"
            >
              <span>Print Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-[#112347] transition"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0b162d] border-b border-blue-900/50 px-4 pt-2 pb-4 space-y-2 shadow-2xl">
          {navLinks.map((link) => {
            const isActive =
              cleanPath === link.path || (link.path === '/print' && cleanPath === '/');
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  isActive
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-[#112347]'
                }`}
              >
                {link.label}
              </button>
            );
          })}

          <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between">
            <button
              onClick={() => handleNav(isAdminLoggedIn ? '/admin/dashboard' : '/admin/login')}
              className="text-xs font-bold text-slate-400 hover:text-white py-2"
            >
              {isAdminLoggedIn ? 'Open Admin Dashboard' : 'Admin Login'}
            </button>
            <button
              onClick={() => handleNav('/print')}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-extrabold rounded-xl shadow-sm"
            >
              Print Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
