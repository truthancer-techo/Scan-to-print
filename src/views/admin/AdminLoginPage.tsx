import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, User, KeyRound, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { loginAdmin, navigate, addToast } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const ok = loginAdmin(username, password);
      setLoading(false);
      if (ok) {
        addToast('success', 'Welcome Sonu Sharma', 'Logged into Admin Dashboard.');
        navigate('/admin/dashboard');
      } else {
        addToast('error', 'Login Failed', 'Invalid credentials. You can use Quick Demo Login.');
      }
    }, 400);
  };

  const handleQuickDemo = () => {
    loginAdmin('admin', 'password123');
    addToast('success', 'Demo Login Successful', 'Logged in as Shop Administrator.');
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-amber-500 text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20 mb-2">
            S
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Sonu Printer Staff Portal
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Management & Spooler System • Merta City, Rajasthan
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">
                Username / Operator ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Quick 1-Click Demo Login button */}
          <div className="pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-extrabold rounded-2xl text-xs transition flex items-center justify-center gap-2 border border-amber-500/20 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Quick Demo Login</span>
            </button>
            <p className="text-[11px] text-slate-500 mt-2">
              Default: <code className="text-slate-400 font-mono">admin</code> /{' '}
              <code className="text-slate-400 font-mono">password123</code>
            </p>
          </div>
        </div>

        {/* Back to Customer Print Portal */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-amber-400 font-semibold transition"
          >
            ← Back to Customer Online Print Portal
          </button>
        </div>
      </div>
    </div>
  );
};
