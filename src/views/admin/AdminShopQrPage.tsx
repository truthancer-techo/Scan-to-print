import React from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Printer, QrCode, Download, Sparkles, MapPin, Phone, ShieldCheck } from 'lucide-react';

export const AdminShopQrPage: React.FC = () => {
  const { business } = useApp();

  const handlePrintStandee = () => {
    window.print();
  };

  const portalUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sonuprinter.com';

  return (
    <AdminLayout pageTitle="Shop QR Standee">
      <div className="space-y-6 max-w-2xl mx-auto print:max-w-none print:w-full">
        {/* Controls Bar (Hidden during print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Printable Counter QR Standee
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Print this high-resolution standee on photo or card sheet to put on your counter
            </p>
          </div>

          <button
            onClick={handlePrintStandee}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl text-xs transition shadow-md self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Print Standee (A4 / 5x7)</span>
          </button>
        </div>

        {/* Printable Standee Frame */}
        <div className="bg-white rounded-3xl border-4 border-amber-500 shadow-2xl p-8 text-center space-y-6 print:border-none print:shadow-none print:p-0 print:rounded-none">
          {/* Top Banner */}
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-full">
              OFFICIAL PRINT SHOP & E-MITRA PORTAL
            </span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mt-2">
              SONU PRINTER
            </h1>
            <p className="text-xs font-bold text-slate-600">
              Station Road, Near Meera Smarak, Merta City
            </p>
          </div>

          {/* Call to action */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <h3 className="text-lg font-black text-amber-950 uppercase tracking-wide">
              Scan & Print From Your Phone
            </h3>
            <p className="text-xs text-amber-800 font-medium mt-0.5">
              No need to wait in line! Upload PDFs, photos, and Aadhaar cards directly.
            </p>
          </div>

          {/* High-res Standee QR Code */}
          <div className="flex justify-center my-4">
            <div className="p-5 bg-white border-4 border-slate-900 rounded-3xl shadow-lg inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                  portalUrl
                )}&margin=10`}
                alt="Sonu Printer Portal QR"
                className="w-56 h-56 object-contain"
              />
              <p className="text-[10px] font-mono font-bold text-slate-500 mt-2">
                {portalUrl}
              </p>
            </div>
          </div>

          {/* Bullet Highlights */}
          <div className="grid grid-cols-3 gap-3 text-left">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="font-extrabold text-xs text-slate-900 block">1. Scan QR</span>
              <span className="text-[10px] text-slate-500">Opens online portal</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="font-extrabold text-xs text-slate-900 block">2. Upload Files</span>
              <span className="text-[10px] text-slate-500">Set color & copies</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <span className="font-extrabold text-xs text-slate-900 block">3. Collect Prints</span>
              <span className="text-[10px] text-slate-500">Ready at counter</span>
            </div>
          </div>

          {/* Footer Contact */}
          <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-bold text-slate-700">
              Helpline: {business?.phone || '+91 98291 45678'}
            </span>
            <span>UPI ID: {business?.upiId || 'sonuprinter@upi'}</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
