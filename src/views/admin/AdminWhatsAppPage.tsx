import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { MessageSquare, Send, CheckCircle2, Phone, Save } from 'lucide-react';

export const AdminWhatsAppPage: React.FC = () => {
  const { business, addToast } = useApp();
  const [waNumber, setWaNumber] = useState<string>(business?.whatsappNumber || '+91 98291 45678');
  const [autoNotify, setAutoNotify] = useState<boolean>(true);

  // Template states
  const [readyTemplate, setReadyTemplate] = useState<string>(
    'Namaste {customer_name}! Your print order {order_id} is READY for pickup at Sonu Printer, near Meera Smarak, Merta City. Total: ₹{amount}. Thank you!'
  );

  // Test sender
  const [testPhone, setTestPhone] = useState<string>('9829012345');
  const [isSending, setIsSending] = useState<boolean>(false);

  const handleSendTest = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      addToast('success', 'WhatsApp Triggered', `Test notification dispatched to +91 ${testPhone}.`);
    }, 1000);
  };

  const handleSave = () => {
    addToast('success', 'WhatsApp Settings Saved', 'Notification templates updated.');
  };

  return (
    <AdminLayout pageTitle="WhatsApp Setup">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              WhatsApp Notifications & Templates
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep customers informed in real-time when prints are ready for pickup
            </p>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-md self-start sm:self-auto"
          >
            Save Settings
          </button>
        </div>

        {/* Channel config */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Official Shop WhatsApp Account
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                WhatsApp Business Phone Number
              </label>
              <input
                type="text"
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-mono font-bold"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="autonotif"
                checked={autoNotify}
                onChange={(e) => setAutoNotify(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="autonotif" className="font-bold text-slate-800 cursor-pointer">
                Auto-trigger WhatsApp alert when Order status turns "Ready"
              </label>
            </div>
          </div>
        </div>

        {/* Message Templates */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-extrabold text-base text-slate-900">
            "Order Ready for Pickup" Template
          </h3>
          <p className="text-slate-500">
            Available variables: <code className="text-amber-700 font-mono font-bold">&#123;customer_name&#125;</code>,{' '}
            <code className="text-amber-700 font-mono font-bold">&#123;order_id&#125;</code>,{' '}
            <code className="text-amber-700 font-mono font-bold">&#123;amount&#125;</code>
          </p>

          <textarea
            rows={3}
            value={readyTemplate}
            onChange={(e) => setReadyTemplate(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-2xl bg-slate-50 font-medium text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {/* Test Sender */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-auto">
              <span className="font-bold text-slate-900 block">Send Test Preview Alert:</span>
              <span className="text-slate-500 text-[11px]">Enter mobile number to verify delivery</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="10-digit number"
                className="px-3 py-1.5 border border-slate-300 rounded-xl bg-white font-mono text-xs w-36"
              />
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendTest}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Test Send'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
