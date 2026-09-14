import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ServiceItem } from '../../types';
import { api } from '../../services/api';
import {
  FileCheck2,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  DollarSign,
  Edit2,
  Layers,
} from 'lucide-react';

export const AdminServicesPage: React.FC = () => {
  const { addToast } = useApp();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // New Service
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Printing');
  const [newPrice, setNewPrice] = useState(10);
  const [newUnit, setNewUnit] = useState('page');

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.getServices();
      setServices(res.services || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleToggleActive = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handlePriceChange = (id: string, price: number) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, startingPrice: Math.max(0, price) } : s))
    );
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: ServiceItem = {
      id: `srv-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDesc.trim(),
      startingPrice: newPrice,
      unit: newUnit.trim(),
      iconName: 'FileText',
      active: true,
    };

    setServices([...services, newItem]);
    setNewTitle('');
    setNewDesc('');
    addToast('info', 'Service Added', 'Click "Save All Services" to persist.');
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      await api.updateServices(services);
      setIsSaving(false);
      addToast('success', 'Saved', 'Services updated successfully.');
    } catch (err: any) {
      setIsSaving(false);
      addToast('error', 'Save Failed', err?.message || 'Could not save services');
    }
  };

  return (
    <AdminLayout pageTitle="Services">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Shop Services & Offerings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage E-Mitra, Xerox, Lamination, Passport photos & pricing displayed to customers
            </p>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-md flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save All Services'}</span>
          </button>
        </div>

        {/* Existing Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {srv.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      srv.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {srv.active ? 'Active' : 'Hidden'}
                  </span>
                </div>

                <h4 className="font-extrabold text-sm text-slate-900 mt-1">{srv.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{srv.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={srv.startingPrice}
                    onChange={(e) =>
                      handlePriceChange(srv.id, parseFloat(e.target.value) || 0)
                    }
                    className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                  <span className="text-slate-400 text-[11px]">/{srv.unit}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleActive(srv.id)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  {srv.active ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Service Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-600" />
            Add New Service Offering
          </h3>

          <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Service Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Spiral Binding"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-bold"
              >
                <option value="Printing">Printing</option>
                <option value="E-Mitra">E-Mitra</option>
                <option value="Cards & Photos">Cards & Photos</option>
                <option value="Online Services">Online Services</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Starting Price (₹)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-mono"
                />
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="unit (book/copy)"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl bg-slate-50"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="font-bold text-slate-700 block mb-1">Short Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="e.g. Durable plastic coil spiral binding with transparent front cover"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl transition"
              >
                + Add Service
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};
