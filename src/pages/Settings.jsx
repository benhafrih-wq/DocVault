import React, { useState, useEffect } from 'react';
import { useClinicProfile, useIncomes, useExpenses, CURRENCIES } from '@/lib/useClinic';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Trash2, Sparkles, Save, CheckCircle2 } from 'lucide-react';
import moment from 'moment';
import { exportFinancialReportCSV } from '@/lib/exportUtils';

export default function Settings() {
  const { data: clinic } = useClinicProfile();
  const { data: incomes = [] } = useIncomes();
  const { data: expenses = [] } = useExpenses();
  const qc = useQueryClient();
  const [clinicName, setClinicName] = useState('');
  const [currency, setCurrency] = useState('DZD');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (clinic) {
      setClinicName(clinic.clinic_name);
      setCurrency(clinic.currency || 'DZD');
    }
  }, [clinic]);

  const saveProfile = async () => {
    if (!clinicName.trim() || !clinic) return;
    setSaving(true);
    try {
      await base44.entities.ClinicProfile.update(clinic.id, { clinic_name: clinicName.trim(), currency });
      await qc.invalidateQueries({ queryKey: ['clinicProfile'] });
      setSavedMsg('Clinic settings saved.');
      setTimeout(() => setSavedMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const rows = [['Type', 'Date', 'Category', 'Reference', 'Amount', 'Payment/Notes']];
    incomes.forEach((i) =>
      rows.push(['Income', i.date?.slice(0, 10), i.category, i.patient_id, i.amount, i.payment_method || ''])
    );
    expenses.forEach((e) =>
      rows.push(['Expense', e.date?.slice(0, 10), e.category, e.vendor_name, e.amount, e.notes || ''])
    );
    const csv = rows.map((r) => r.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medtrack-transactions-${moment().format('YYYYMMDD')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const seedDemo = async () => {
    if (!window.confirm('This will add sample income and expense records. Continue?')) return;
    setBusy(true);
    try {
      const demoIncomes = [
        { patient_id: 'Pt #1042', patient_name: 'A. Benali', category: 'Joint Replacement (Arthroplasty)', is_surgical: true, procedure_notes: 'Total Knee Arthroplasty - Right', amount: 185000, payment_method: 'Insurance Claim', date: moment().subtract(5, 'days').toISOString() },
        { patient_id: 'Pt #1043', patient_name: 'S. Khelifi', category: 'Outpatient Consultation', is_surgical: false, procedure_notes: 'Routine follow-up', amount: 2500, payment_method: 'Cash', date: moment().subtract(3, 'days').toISOString() },
        { patient_id: 'Pt #1044', patient_name: 'M. Saidi', category: 'PRP / Joint Infiltration', is_surgical: false, procedure_notes: 'PRP infiltration - knee', amount: 12000, payment_method: 'Cash', date: moment().subtract(10, 'days').toISOString() },
        { patient_id: 'Pt #1045', patient_name: 'R. Mansouri', category: 'Ultrasound / Imaging', is_surgical: false, procedure_notes: 'X-ray + MRI review', amount: 4500, payment_method: 'Bank Transfer', date: moment().subtract(20, 'days').toISOString() },
        { patient_id: 'Pt #1046', patient_name: 'Y. Brahimi', category: 'Bracing & Immobilization', is_surgical: false, procedure_notes: 'Knee brace fitting', amount: 8000, payment_method: 'Cash', date: moment().subtract(40, 'days').toISOString() },
        { patient_id: 'Pt #1047', patient_name: 'L. Haddad', category: 'Arthroscopic Surgery', is_surgical: true, procedure_notes: 'Shoulder arthroscopy', amount: 95000, payment_method: 'Insurance Claim', date: moment().subtract(70, 'days').toISOString() },
      ];
      const demoExpenses = [
        { vendor_name: 'MedImplant Co.', category: 'Surgical Supplies & Implants', amount: 64000, notes: 'TKA implant set', date: moment().subtract(6, 'days').toISOString() },
        { vendor_name: 'ClinicRent LLC', category: 'Facility Rent & Utilities', amount: 45000, notes: 'Monthly rent', date: moment().subtract(15, 'days').toISOString() },
        { vendor_name: 'PharmaSupply', category: 'Pharmaceuticals & Injections Stock', amount: 18000, notes: 'PRP kits + steroids', date: moment().subtract(12, 'days').toISOString() },
        { vendor_name: 'Staff Payroll', category: 'Staff & Administrative', amount: 120000, notes: 'Nurses + admin salaries', date: moment().subtract(18, 'days').toISOString() },
        { vendor_name: 'EquipTech', category: 'Clinical Equipment & Maintenance', amount: 22000, notes: 'C-arm maintenance', date: moment().subtract(50, 'days').toISOString() },
      ];
      await base44.entities.Income.bulkCreate(demoIncomes);
      await base44.entities.Expense.bulkCreate(demoExpenses);
      await qc.invalidateQueries({ queryKey: ['incomes'] });
      await qc.invalidateQueries({ queryKey: ['expenses'] });
      setSavedMsg('Demo data added.');
      setTimeout(() => setSavedMsg(''), 3000);
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('This will permanently delete ALL income and expense records. Continue?')) return;
    setBusy(true);
    try {
      await base44.entities.Income.deleteMany({});
      await base44.entities.Expense.deleteMany({});
      await qc.invalidateQueries({ queryKey: ['incomes'] });
      await qc.invalidateQueries({ queryKey: ['expenses'] });
      setSavedMsg('All transaction data cleared.');
      setTimeout(() => setSavedMsg(''), 3000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Settings</h1>
        <p className="text-[#64748B] text-sm">Manage your clinic profile and data</p>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 text-sm text-[#059669] bg-[#ECFDF5] rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4" /> {savedMsg}
        </div>
      )}

      {/* Clinic profile */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-4">
        <h2 className="font-semibold text-[#1E293B]">Clinic Profile</h2>
        <div className="space-y-1.5">
          <Label>Clinic Name</Label>
          <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Default Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c === 'DZD' ? 'DZD (DA)' : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={saveProfile} disabled={saving || !clinicName.trim()} className="bg-[#006D77] hover:bg-[#005a63]">
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Data management */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-3">
        <h2 className="font-semibold text-[#1E293B]">Data Management</h2>
        <p className="text-sm text-[#64748B]">Export your full transaction history, or manage demo data.</p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => exportFinancialReportCSV(incomes, expenses, clinic?.currency)}>
            <Download className="w-4 h-4 mr-1" /> Export Financial Report
          </Button>
          <Button variant="outline" onClick={seedDemo} disabled={busy}>
            <Sparkles className="w-4 h-4 mr-1" /> Seed Demo Data
          </Button>
          <Button variant="outline" onClick={clearAll} disabled={busy} className="text-[#E11D48] hover:bg-[#FFF1F2]">
            <Trash2 className="w-4 h-4 mr-1" /> Clear All Data
          </Button>
        </div>
        <p className="text-xs text-[#64748B] pt-1">
          {incomes.length} income records · {expenses.length} expense records
        </p>
      </div>
    </div>
  );
}