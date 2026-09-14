import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DiscountRule } from '../../types';
import { api } from '../../services/api';
import { Tag, Plus, Trash2, CheckCircle2, Save, Sparkles, Percent } from 'lucide-react';

export const AdminDiscountsPage: React.FC = () => {
  const { discounts, refreshData, addToast } = useApp();

  const [rules, setRules] = useState<DiscountRule[]>(discounts);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // New rule form
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'volume' | 'coupon' | 'flat'>('volume');
  const [newMinPages, setNewMinPages] = useState<number>(50);
  const [newPercent, setNewPercent] = useState<number>(10);
  const [newCouponCode, setNewCouponCode] = useState<string>('');

  const handleToggleActive = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const handleDelete = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRule: DiscountRule = {
      id: `disc-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      minPages: newType === 'volume' ? newMinPages : undefined,
      percentage: newPercent,
      couponCode: newType === 'coupon' ? newCouponCode.trim().toUpperCase() : undefined,
      active: true,
    };

    setRules([...rules, newRule]);
    setNewTitle('');
    setNewCouponCode('');
    addToast('info', 'Rule Added', 'Click "Save Discounts" to publish changes.');
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await api.updateDiscounts(rules);
      await refreshData();
      setIsSaving(false);
      addToast('success', 'Discounts Saved', 'Discounts updated and live on customer portal.');
    } catch (err: any) {
      setIsSaving(false);
      addToast('error', 'Save Failed', err?.message || 'Could not save discount rules');
    }
  };

  return (
    <AdminLayout pageTitle="Discounts">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Discounts & Volume Tiers
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure bulk page order discounts, coupon codes, and festival promos
            </p>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-md flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Discounts'}</span>
          </button>
        </div>

        {/* Existing Discount Rules List */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">Active Discount Rules</h3>

          <div className="divide-y divide-slate-100">
            {rules.map((r) => (
              <div
                key={r.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{r.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {r.active ? 'Active' : 'Disabled'}
                    </span>
                    {r.couponCode && (
                      <span className="font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                        CODE: {r.couponCode}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    {r.type === 'volume'
                      ? `Applies automatically on orders with ${r.minPages}+ pages`
                      : r.type === 'coupon'
                      ? 'Requires customer entering coupon code at checkout'
                      : 'Flat percentage promotion'}
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <span className="font-mono font-extrabold text-base text-emerald-700">
                    {r.percentage}% OFF
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(r.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                      r.active
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {r.active ? 'Disable' : 'Enable'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Rule Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-600" />
            Add New Discount or Coupon
          </h3>

          <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Discount Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Merta Exam Season 10% Off"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Discount Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-bold"
              >
                <option value="volume">Volume Tier (Bulk Pages)</option>
                <option value="coupon">Coupon Code</option>
                <option value="flat">Flat Percentage</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Discount Percentage (%)</label>
              <input
                type="number"
                min={1}
                max={90}
                required
                value={newPercent}
                onChange={(e) => setNewPercent(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-mono"
              />
            </div>

            {newType === 'volume' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Minimum Pages</label>
                <input
                  type="number"
                  min={1}
                  value={newMinPages}
                  onChange={(e) => setNewMinPages(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-mono"
                />
              </div>
            )}

            {newType === 'coupon' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MERTA15"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-mono font-bold"
                />
              </div>
            )}

            <div className="sm:col-span-2 pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl transition"
              >
                + Add Rule to List
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};
