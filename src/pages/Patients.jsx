import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients, useIncomes, useClinicProfile, formatCurrency, PATIENT_JOINTS } from '@/lib/useClinic';
import PatientForm from '@/components/PatientForm';
import PatientDetailDialog from '@/components/PatientDetailDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, UserRound, Phone } from 'lucide-react';

const PAID_STATUSES = ['Paid in Cash', 'Paid in Full'];

export default function Patients() {
  const navigate = useNavigate();
  const { data: patients = [], isLoading } = usePatients();
  const { data: incomes = [] } = useIncomes();
  const { data: clinic } = useClinicProfile();
  const [search, setSearch] = useState('');
  const [jointFilter, setJointFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  // Auto-open a patient profile when linked from another page (/patients?patient=<id>)
  useEffect(() => {
    const focusId = new URLSearchParams(window.location.search).get('patient');
    if (focusId && patients.length) {
      const p = patients.find((x) => x.id === focusId);
      if (p) {
        setDetail(p);
        navigate('/patients', { replace: true });
      }
    }
  }, [patients, navigate]);

  const stats = useMemo(() => {
    const m = new Map();
    incomes.forEach((i) => {
      if (!i.patient_id) return;
      const s = m.get(i.patient_id) || { billed: 0, paid: 0, visits: 0 };
      s.billed += Number(i.amount || 0);
      if (!i.payment_status || PAID_STATUSES.includes(i.payment_status)) s.paid += Number(i.amount || 0);
      s.visits += 1;
      m.set(i.patient_id, s);
    });
    return m;
  }, [incomes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients.filter((p) => {
      if (jointFilter !== 'all' && p.primary_joint !== jointFilter) return false;
      if (q) {
        const hay = `${p.full_name} ${p.patient_code} ${p.phone_number || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [patients, search, jointFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Patient Directory</h1>
          <p className="text-[#64748B] text-sm">Manage patient profiles and their financial history</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-[#006D77] hover:bg-[#005a63]">
          <Plus className="w-4 h-4 mr-1" /> Add Patient
        </Button>
      </div>

      {/* Search & filter bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] font-medium">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, patient ID, or phone" className="pl-9" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] font-medium">Primary Joint</label>
          <Select value={jointFilter} onValueChange={setJointFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All joints</SelectItem>
              {PATIENT_JOINTS.map((j) => (
                <SelectItem key={j} value={j}>{j}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Patient cards */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-[#64748B] text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <UserRound className="w-10 h-10 text-[#83C5BE] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">
            {patients.length === 0 ? 'No patients registered yet. Add your first patient.' : 'No patients match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const s = stats.get(p.id) || { billed: 0, paid: 0, visits: 0 };
            const outstanding = s.billed - s.paid;
            return (
              <button
                key={p.id}
                onClick={() => setDetail(p)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md hover:border-[#83C5BE] transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1E293B] truncate">{p.full_name}</div>
                    <span className="inline-block text-[10px] font-semibold text-[#006D77] bg-[#E0F2F1] rounded-full px-2 py-0.5 mt-1">
                      {p.patient_code}
                    </span>
                  </div>
                  {outstanding > 0 ? (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 rounded-full px-2 py-1 shrink-0">
                      Pending
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-1 shrink-0">
                      Paid
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-[#64748B]">
                  {p.phone_number && (
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone_number}</span>
                  )}
                  {p.primary_joint && <span>{p.primary_joint}</span>}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#64748B] uppercase tracking-wide">Lifetime billed</div>
                    <div className="text-sm font-bold text-[#1E293B]">{formatCurrency(s.billed, clinic?.currency)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#64748B] uppercase tracking-wide">Visits</div>
                    <div className="text-sm font-bold text-[#1E293B]">{s.visits}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <PatientForm open={addOpen} onOpenChange={setAddOpen} />
      <PatientDetailDialog patient={detail} onClose={() => setDetail(null)} />
    </div>
  );
}