import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, MapPin, ShieldCheck, Menu, X, ArrowRight, UserCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentPath, navigate, isAdminLoggedIn, adminUser } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navLinks = [
    { label: 'Print Now', path: '/print' },
    { label: 'Track Order', path: '/track' },
    { label: 'Services', path: '/services' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleNav = (p: string) => {
    navigate(p);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => handleNav('/print')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-lg shadow-sm group-hover:bg-amber-400 transition">
            <Printer className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                PRINT
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                Merta City
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Print Portal & E-Mitra Services
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-slate-900 text-amber-400'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Admin Access */}
        <div className="hidden sm:flex items-center gap-2">
          {isAdminLoggedIn ? (
            <button
              onClick={() => handleNav('/admin/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 rounded-xl text-xs font-bold transition border border-amber-300/50"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Admin Dashboard</span>
            </button>
          ) : (
            <button
              onClick={() => handleNav('/admin/login')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              Staff / Admin
            </button>
          )}

          <button
            onClick={() => handleNav('/print')}
            className="flex items-center gap-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-sm transition"
          >
            <span>Print Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNav(link.path)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                currentPath === link.path
                  ? 'bg-slate-900 text-amber-400'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </button>
          ))}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => handleNav(isAdminLoggedIn ? '/admin/dashboard' : '/admin/login')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              {isAdminLoggedIn ? 'Open Admin Dashboard' : 'Admin Login'}
            </button>
            <button
              onClick={() => handleNav('/print')}
              className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-extrabold rounded-xl"
            >
              Print Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
