import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, Phone, Mail, Clock, MessageSquare, ExternalLink, ShieldCheck, Printer } from 'lucide-react';

export const CustomerContactPage: React.FC = () => {
  const { business } = useApp();

  const phone = business?.phone || '+91 98291 45678';
  const wa = business?.whatsappNumber?.replace(/\D/g, '') || '9829145678';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 px-4 pt-4 text-white">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-orange-400 bg-orange-500/15 px-3.5 py-1 rounded-full border border-orange-500/30">
          Visit or Call Us
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Contact Sonu Printer
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Conveniently located near historical Meera Smarak in Merta City, Rajasthan.
        </p>
      </div>

      {/* 2-Column Info & Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info Card */}
        <div className="bg-[#0b162d] rounded-3xl p-6 sm:p-8 border border-blue-900/50 shadow-xl space-y-6">
          <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-400" />
            Shop Address & Location
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">
                  {business?.address || 'Shop No. 4, Near Meera Smarak, Station Road'}
                </p>
                <p className="text-slate-400 mt-0.5">
                  Landmark: {business?.landmark || 'Near Meera Smarak & Court Circle'}
                </p>
                <p className="text-slate-400">
                  {business?.city || 'Merta City'}, {business?.state || 'Rajasthan'} -{' '}
                  {business?.pincode || '341510'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Working Hours</p>
                <p className="text-slate-400 mt-0.5">
                  {business?.openingHours ||
                    '8:30 AM - 8:30 PM (Mon - Sat), 10:00 AM - 4:00 PM (Sun)'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Direct Phone Numbers</p>
                <p className="text-slate-200 font-mono mt-0.5">{phone}</p>
                {business?.alternatePhone && (
                  <p className="text-slate-400 font-mono text-[11px]">
                    Alt: {business.alternatePhone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Email Address</p>
                <p className="text-slate-300 mt-0.5">
                  {business?.email || 'sonuprinter.merta@gmail.com'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-900/40 flex flex-col gap-2">
            <a
              href={`https://wa.me/91${wa}?text=Hello%20Sonu%20Printer,%20I%20have%20an%20inquiry%20regarding%20printing%20services.`}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat on WhatsApp ({phone})</span>
            </a>

            <a
              href={`tel:${phone}`}
              className="py-2.5 px-4 bg-[#112347] hover:bg-[#162c5a] text-slate-200 hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-blue-800/40 transition active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 text-orange-400" />
              <span>Call Counter Directly</span>
            </a>
          </div>
        </div>

        {/* Location Landmark & Map Card */}
        <div className="bg-[#0b162d] rounded-3xl p-6 sm:p-8 border border-blue-900/50 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-extrabold text-lg text-white">Meera Smarak Landmark</h3>
            <p className="text-xs text-slate-400 mt-1">
              Located right on Station Road close to the historic Meera Smarak and Civil Court Circle, easily accessible for citizens and visitors in Merta City.
            </p>

            {/* Stylized Merta City Map Graphic */}
            <div className="mt-4 rounded-2xl bg-[#070e1c] p-6 border border-blue-900/60 text-center relative overflow-hidden">
              <div className="w-16 h-16 mx-auto rounded-full bg-orange-500/15 text-orange-400 flex items-center justify-center mb-3 border border-orange-500/30">
                <MapPin className="w-8 h-8 stroke-[2.5]" />
              </div>
              <p className="font-bold text-sm text-white">Sonu Printer Counter</p>
              <p className="text-xs text-slate-400 mt-1">
                Near Meera Smarak • Station Road, Merta City
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Parking Available
              </div>
            </div>
          </div>

          <div className="bg-[#070e1c] p-4 rounded-2xl border border-blue-900/50 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-white block">Popular In-Shop Facilities:</span>
            <p>• High-speed Wi-Fi for quick customer document transfer</p>
            <p>• Professional photo lighting setup for instant passport photos</p>
            <p>• Heavy duty hot roll laminators for court deeds & marksheets</p>
          </div>
        </div>
      </div>
    </div>
  );
};
