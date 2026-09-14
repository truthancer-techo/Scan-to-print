import React from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, MapPin, Phone, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate, business } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Location */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-extrabold text-base">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <Printer className="w-4 h-4" />
              </div>
              <span>SONU PRINTER</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Professional offline printing, high-speed Xerox, and E-Mitra document counter near Meera Smarak, Merta City, Rajasthan.
            </p>
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>Station Road, Near Meera Smarak, Merta City - 341510</span>
            </div>
          </div>

          {/* Col 2: Services */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Services</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>Online & In-Shop Document Print</li>
              <li>E-Mitra & Jan Aadhaar Form Filling</li>
              <li>Urgent Passport Photos (8 / 16 Pack)</li>
              <li>PVC Smart Cards (Aadhaar, PAN, Voter)</li>
              <li>High-Speed Book & Legal Photocopy</li>
              <li>Hot Roll Document Lamination</li>
            </ul>
          </div>

          {/* Col 3: Customer Navigation */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button onClick={() => navigate('/print')} className="hover:text-amber-400 transition">
                  QR Print Portal (/print)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/track')} className="hover:text-amber-400 transition">
                  Track Live Order (/track)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/services')} className="hover:text-amber-400 transition">
                  All Services & Rates (/services)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/contact')} className="hover:text-amber-400 transition">
                  Shop Contact & Timings (/contact)
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/admin/login')} className="hover:text-amber-400 transition">
                  Staff / Admin Management
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Shop Timings & Support */}
          <div className="space-y-2">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Shop Timings</h4>
            <p className="text-[11px] text-slate-300">
              Monday - Saturday: 8:30 AM - 8:30 PM<br />
              Sunday: 10:00 AM - 4:00 PM
            </p>
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block">Phone Support:</span>
              <span className="font-mono text-white text-xs font-bold">
                {business?.phone || '+91 98291 45678'}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Confidential Print Guarantee
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Sonu Printer. All rights reserved. Merta City, Rajasthan.</p>
          <p className="flex items-center gap-1">
            Built for Sonu Printer • Near Meera Smarak
          </p>
        </div>
      </div>
    </footer>
  );
};
