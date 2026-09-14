import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { UserCog, Plus, ShieldCheck, Mail, Phone, Trash2 } from 'lucide-react';

export const AdminEmployeesPage: React.FC = () => {
  const { addToast } = useApp();

  const [staff, setStaff] = useState([
    {
      id: 'emp-1',
      name: 'Sonu Sharma',
      role: 'Shop Owner / Admin',
      phone: '+91 98291 45678',
      email: 'sonu@sonuprinter.com',
      shift: 'Full Day (8:30 AM - 8:30 PM)',
      active: true,
    },
    {
      id: 'emp-2',
      name: 'Mukesh Prajapat',
      role: 'E-Mitra & Print Operator',
      phone: '+91 98290 55432',
      email: 'mukesh@sonuprinter.com',
      shift: 'Morning Shift',
      active: true,
    },
    {
      id: 'emp-3',
      name: 'Dinesh Gurjar',
      role: 'Binding & Lamination Specialist',
      phone: '+91 94140 12890',
      email: 'dinesh@sonuprinter.com',
      shift: 'Evening Shift',
      active: true,
    },
  ]);

  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Print Operator');
  const [newPhone, setNewPhone] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setStaff([
      ...staff,
      {
        id: `emp-${Date.now()}`,
        name: newName.trim(),
        role: newRole,
        phone: newPhone.trim() || '+91 98290 00000',
        email: `${newName.toLowerCase().replace(/\s+/g, '')}@sonuprinter.com`,
        shift: 'General Counter',
        active: true,
      },
    ]);

    setNewName('');
    setNewPhone('');
    addToast('success', 'Staff Member Added', 'New operator added to counter team.');
  };

  return (
    <AdminLayout pageTitle="Employees">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Shop Staff & Counter Operators
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage operator accounts, roles, and shift assignments at Sonu Printer
          </p>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 font-extrabold flex items-center justify-center text-sm mb-3">
                  {member.name.charAt(0)}
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">{member.name}</h3>
                <span className="inline-block text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1">
                  {member.role}
                </span>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {member.phone}
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {member.email}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{member.shift}</span>
                <span className="text-emerald-700 font-bold">Active</span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Employee Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-600" />
            Add Staff Member
          </h3>

          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Ratan Singh"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Role / Designation</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-bold"
              >
                <option value="Print Operator">Print Operator</option>
                <option value="E-Mitra Specialist">E-Mitra Specialist</option>
                <option value="Shop Manager">Shop Manager</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mobile Number</label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="e.g. 98290 11223"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 font-mono"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold rounded-xl transition"
              >
                + Add Operator
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};
