import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatients, nextPatientCode, GENDERS, PATIENT_JOINTS } from '@/lib/useClinic';

const EMPTY = {
  full_name: '',
  phone_number: '',
  age: '',
  gender: '__',
  primary_joint: '__',
  notes: '',
};

export default function PatientForm({ open, onOpenChange }) {
  const qc = useQueryClient();
  const { data: patients = [] } = usePatients();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...EMPTY });
  }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Patient.create({
        full_name: form.full_name.trim(),
        patient_code: nextPatientCode(patients),
        phone_number: form.phone_number || undefined,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender !== '__' ? form.gender : undefined,
        primary_joint: form.primary_joint !== '__' ? form.primary_joint : undefined,
        notes: form.notes || undefined,
      });
      await qc.invalidateQueries({ queryKey: ['patients'] });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Patient</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 bg-[#E0F2F1] rounded-lg px-3 py-2">
            <span className="text-xs text-[#64748B]">Auto-generated Patient ID</span>
            <span className="text-sm font-bold text-[#006D77]">{nextPatientCode(patients)}</span>
          </div>
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="e.g. Amine Mansouri" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={form.phone_number} onChange={(e) => set('phone_number', e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Age</Label>
              <Input type="number" value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Primary Joint</Label>
              <Select value={form.primary_joint} onValueChange={(v) => set('primary_joint', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PATIENT_JOINTS.map((j) => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Clinical / administrative notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !form.full_name.trim()} className="bg-[#006D77] hover:bg-[#005a63]">
            {saving ? 'Saving...' : 'Save Patient'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
