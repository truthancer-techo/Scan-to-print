import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, Phone, Mail, Clock, MessageSquare, ExternalLink, ShieldCheck, Printer } from 'lucide-react';

export const CustomerContactPage: React.FC = () => {
  const { business } = useApp();

  const phone = business?.phone || '+91 98291 45678';
  const wa = business?.whatsappNumber?.replace(/\D/g, '') || '9829145678';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
          Visit or Call Us
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Contact Sonu Printer
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Conveniently located near historical Meera Smarak in Merta City, Rajasthan.
        </p>
      </div>

      {/* 2-Column Info & Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            Shop Address & Location
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-sm">
                  {business?.address || 'Shop No. 4, Near Meera Smarak, Station Road'}
                </p>
                <p className="text-slate-500 mt-0.5">
                  Landmark: {business?.landmark || 'Near Meera Smarak & Court Circle'}
                </p>
                <p className="text-slate-500">
                  {business?.city || 'Merta City'}, {business?.state || 'Rajasthan'} -{' '}
                  {business?.pincode || '341510'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Working Hours</p>
                <p className="text-slate-500 mt-0.5">
                  {business?.openingHours ||
                    '8:30 AM - 8:30 PM (Mon - Sat), 10:00 AM - 4:00 PM (Sun)'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Direct Phone Numbers</p>
                <p className="text-slate-700 font-mono mt-0.5">{phone}</p>
                {business?.alternatePhone && (
                  <p className="text-slate-500 font-mono text-[11px]">
                    Alt: {business.alternatePhone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Email Address</p>
                <p className="text-slate-600 mt-0.5">
                  {business?.email || 'sonuprinter.merta@gmail.com'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <a
              href={`https://wa.me/91${wa}?text=Hello%20Sonu%20Printer,%20I%20have%20an%20inquiry%20regarding%20printing%20services.`}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat on WhatsApp ({phone})</span>
            </a>

            <a
              href={`tel:${phone}`}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Counter Directly</span>
            </a>
          </div>
        </div>

        {/* Location Landmark & Map Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Meera Smarak Landmark</h3>
            <p className="text-xs text-slate-500 mt-1">
              Located right on Station Road close to the historic Meera Smarak and Civil Court Circle, easily accessible for citizens and visitors in Merta City.
            </p>

            {/* Stylized Merta City Map Graphic */}
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-amber-50 to-slate-100 p-6 border border-slate-200 text-center relative overflow-hidden">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center mb-3">
                <MapPin className="w-8 h-8 stroke-[2.5]" />
              </div>
              <p className="font-bold text-sm text-slate-900">Sonu Printer Counter</p>
              <p className="text-xs text-slate-600 mt-1">
                Near Meera Smarak • Station Road, Merta City
              </p>
              <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Parking Available
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-900 block">Popular In-Shop Facilities:</span>
            <p>• High-speed Wi-Fi for quick customer document transfer</p>
            <p>• Professional photo lighting setup for instant passport photos</p>
            <p>• Heavy duty hot roll laminators for court deeds & marksheets</p>
          </div>
        </div>
      </div>
    </div>
  );
};
