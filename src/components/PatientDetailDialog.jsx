import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIncomes, useClinicProfile, formatCurrency } from '@/lib/useClinic';
import IncomeForm from '@/components/IncomeForm';
import { Plus, Phone, CalendarDays, StickyNote } from 'lucide-react';

const PAID_STATUSES = ['Paid in Cash', 'Paid in Full'];

export default function PatientDetailDialog({ patient, onClose }) {
  const { data: incomes = [] } = useIncomes();
  const { data: clinic } = useClinicProfile();
  const [incomeOpen, setIncomeOpen] = useState(false);

  if (!patient) return null;

  const txs = incomes
    .filter((i) => i.patient_id === patient.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const billed = txs.reduce((s, i) => s + Number(i.amount || 0), 0);
  const paid = txs
    .filter((i) => !i.payment_status || PAID_STATUSES.includes(i.payment_status))
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const outstanding = billed - paid;

  return (
    <Dialog open={!!patient} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {patient.full_name}
            <span className="text-xs font-semibold text-[#006D77] bg-[#E0F2F1] rounded-full px-2.5 py-1">
              {patient.patient_code}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[#64748B]">
            {patient.phone_number && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{patient.phone_number}</span>}
            {patient.age != null && <span>{patient.age} yrs</span>}
            {patient.gender && <span>{patient.gender}</span>}
            {patient.primary_joint && (
              <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{patient.primary_joint}</span>
            )}
          </div>
          {patient.notes && (
            <p className="text-sm text-[#64748B] bg-gray-50 rounded-lg px-3 py-2 flex gap-2">
              <StickyNote className="w-4 h-4 shrink-0 mt-0.5" />{patient.notes}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#E0F2F1] rounded-xl p-3">
              <div className="text-[11px] text-[#006D77] font-medium">Total Billed</div>
              <div className="text-sm font-bold text-[#006D77]">{formatCurrency(billed, clinic?.currency)}</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <div className="text-[11px] text-emerald-700 font-medium">Total Paid</div>
              <div className="text-sm font-bold text-emerald-700">{formatCurrency(paid, clinic?.currency)}</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-3">
              <div className="text-[11px] text-rose-600 font-medium">Outstanding</div>
              <div className="text-sm font-bold text-rose-600">{formatCurrency(outstanding, clinic?.currency)}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-[11px] text-[#64748B] font-medium">Visits / Procedures</div>
              <div className="text-sm font-bold text-[#1E293B]">{txs.length}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm text-[#1E293B] mb-2">Transaction History</h3>
            {txs.length === 0 ? (
              <p className="text-sm text-[#64748B] py-4 text-center bg-gray-50 rounded-lg">No transactions recorded yet.</p>
            ) : (
              <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
                {txs.map((t) => (
                  <div key={t.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#1E293B] truncate">{t.category}</div>
                      <div className="text-xs text-[#64748B]">
                        {new Date(t.date).toLocaleDateString()}
                        {t.procedure_notes ? ` · ${t.procedure_notes}` : ''}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-emerald-600 shrink-0">
                      +{formatCurrency(t.amount, clinic?.currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setIncomeOpen(true)} className="bg-[#006D77] hover:bg-[#005a63]">
            <Plus className="w-4 h-4 mr-1" /> Log Income for this Patient
          </Button>
        </div>

        <IncomeForm
          open={incomeOpen}
          onOpenChange={setIncomeOpen}
          preset={{ patient_id: patient.id, patient_name: patient.full_name }}
        />
      </DialogContent>
    </Dialog>
  );
}
