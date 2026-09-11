import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { EXPENSE_CATEGORIES, useCustomCategories, useIncomes, todayISODate } from '@/lib/useClinic';
import CategorySelect from '@/components/CategorySelect';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2, Paperclip } from 'lucide-react';

const EMPTY = {
  vendor_name: '',
  category: '',
  amount: '',
  receipt_url: '',
  notes: '',
  linked_income_id: '',
  date: todayISODate(),
};

export default function ExpenseForm({ open, onOpenChange }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { data: customs = [] } = useCustomCategories('expense');
  const { data: incomes = [] } = useIncomes();

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, category: EXPENSE_CATEGORIES[0], date: todayISODate() });
    }
  }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('receipt_url', file_url);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.vendor_name || !form.amount || !form.category) return;
    setSaving(true);
    try {
      const isPreset = EXPENSE_CATEGORIES.includes(form.category);
      const isExistingCustom = customs.some((c) => c.name.toLowerCase() === form.category.trim().toLowerCase());
      if (!isPreset && !isExistingCustom) {
        await base44.entities.CustomCategory.create({ name: form.category.trim(), type: 'expense' });
        await qc.invalidateQueries({ queryKey: ['customCategories'] });
      }
      await base44.entities.Expense.create({
        vendor_name: form.vendor_name,
        category: form.category.trim(),
        amount: Number(form.amount),
        receipt_url: form.receipt_url || undefined,
        notes: form.notes || undefined,
        linked_income_id: form.linked_income_id || undefined,
        date: new Date(form.date).toISOString(),
      });
      await qc.invalidateQueries({ queryKey: ['expenses'] });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Vendor Name *</Label>
            <Input value={form.vendor_name} onChange={(e) => set('vendor_name', e.target.value)} placeholder="e.g. MedImplant Co." />
          </div>
          <CategorySelect mode="expense" value={form.category} onChange={(v) => set('category', v)} resetKey={open} />
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
          <div className="space-y-1.5">
            <Label>Linked Surgical Case (for net margin)</Label>
            <Select value={form.linked_income_id || 'none'} onValueChange={(v) => set('linked_income_id', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not linked</SelectItem>
                {incomes.slice(0, 20).map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.patient_name || i.patient_id} · {i.category} · {i.date?.slice(0, 10)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Receipt Attachment</Label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 cursor-pointer text-sm text-[#64748B] hover:bg-gray-50">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {form.receipt_url ? 'Replace file' : 'Upload receipt'}
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
              </label>
              {form.receipt_url && (
                <span className="flex items-center gap-1 text-xs text-[#059669] truncate">
                  <Paperclip className="w-3 h-3" /> Attached
                </span>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || uploading || !form.vendor_name || !form.amount || !form.category} className="bg-[#E11D48] hover:bg-[#c4183f]">
            {saving ? 'Saving...' : 'Save Expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
