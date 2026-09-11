import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { PAYMENT_METHODS, PAYMENT_STATUSES, ANATOMY_OPTIONS, todayISODate, useCustomCategories, INCOME_CATEGORIES, SURGICAL_CATEGORIES } from '@/lib/useClinic';
import PatientSelect from '@/components/PatientSelect';
import CategorySelect from '@/components/CategorySelect';
import { useQueryClient } from '@tanstack/react-query';

const EMPTY = {
  patient_id: '',
  patient_name: '',
  category: '',
  procedure_notes: '',
  amount: '',
  payment_method: 'Cash',
  payment_status: 'Paid in Full',
  anatomy: '__',
  surgical_facility: '',
  date: todayISODate(),
};

export default function IncomeForm({ open, onOpenChange, mode = 'income' }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { data: customs = [] } = useCustomCategories(mode);

  const presets = mode === 'surgical' ? SURGICAL_CATEGORIES : INCOME_CATEGORIES;
  const isSurgical = mode === 'surgical';
  const accentClass = isSurgical ? 'bg-[#006D77] hover:bg-[#005a63]' : 'bg-[#2A9D8F] hover:bg-[#238a7e]';

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, category: presets[0], date: todayISODate() });
    }
  }, [open, mode]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.patient_id || !form.amount || !form.category) return;
    setSaving(true);
    try {
      const isPreset = presets.includes(form.category);
      const isExistingCustom = customs.some((c) => c.name.toLowerCase() === form.category.trim().toLowerCase());
      if (!isPreset && !isExistingCustom) {
        await base44.entities.CustomCategory.create({ name: form.category.trim(), type: mode });
        await qc.invalidateQueries({ queryKey: ['customCategories'] });
      }
      await base44.entities.Income.create({
        patient_id: form.patient_id,
        patient_name: form.patient_name || undefined,
        category: form.category.trim(),
        is_surgical: isSurgical,
        procedure_notes: form.procedure_notes || undefined,
        amount: Number(form.amount),
        payment_method: form.payment_method,
        payment_status: form.payment_status || undefined,
        anatomy: form.anatomy !== '__' ? form.anatomy : undefined,
        surgical_facility: form.surgical_facility || undefined,
        date: new Date(form.date).toISOString(),
      });
      await qc.invalidateQueries({ queryKey: ['incomes'] });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isSurgical ? 'Log Surgical Income' : 'Log Income'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <PatientSelect
            value={{ patient_id: form.patient_id, patient_name: form.patient_name }}
            onChange={(v) => {
              set('patient_id', v.patient_id);
              set('patient_name', v.patient_name);
            }}
          />
          <CategorySelect mode={mode} value={form.category} onChange={(v) => set('category', v)} resetKey={open} />
          <div className="space-y-1.5">
            <Label>{isSurgical ? 'Procedure Notes' : 'Notes'}</Label>
            <Input value={form.procedure_notes} onChange={(e) => set('procedure_notes', e.target.value)} placeholder={isSurgical ? 'e.g. Total Knee Arthroplasty - Right' : 'e.g. Follow-up consultation'} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={form.payment_method} onValueChange={(v) => set('payment_method', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              <Select value={form.payment_status} onValueChange={(v) => set('payment_status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Anatomy / Joint</Label>
              <Select value={form.anatomy} onValueChange={(v) => set('anatomy', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANATOMY_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Surgical Facility</Label>
              <Input value={form.surgical_facility} onChange={(e) => set('surgical_facility', e.target.value)} placeholder="Hospital / OR name" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !form.patient_id || !form.amount || !form.category} className={accentClass}>
            {saving ? 'Saving...' : isSurgical ? 'Save Surgical Income' : 'Save Income'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
