import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/useClinic';

export default function RecentActivity({ incomes = [], expenses = [], currency }) {
  const navigate = useNavigate();

  const items = useMemo(() => {
    const inc = incomes.map((i) => ({
      key: 'inc-' + i.id,
      type: 'income',
      ref: i.patient_name || i.patient_id,
      patientId: i.patient_id,
      category: i.category,
      date: i.date,
      amount: Number(i.amount || 0),
    }));
    const exp = expenses.map((e) => ({
      key: 'exp-' + e.id,
      type: 'expense',
      ref: e.vendor_name,
      category: e.category,
      date: e.date,
      amount: Number(e.amount || 0),
    }));
    return [...inc, ...exp]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [incomes, expenses]);

  if (!items.length) {
    return <p className="text-sm text-[#64748B] py-6 text-center">No recent activity yet. Log your first transaction to get started.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {items.map((it) => (
        <div key={it.key} className="flex items-center justify-between py-3">
          <div className="min-w-0 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
              style={{
                background: it.type === 'income' ? '#ECFDF5' : '#FFF1F2',
                color: it.type === 'income' ? '#059669' : '#E11D48',
              }}
            >
              {it.type === 'income' ? '+' : '−'}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-[#1E293B] truncate">
                {it.type === 'income' && it.patientId ? (
                  <button
                    onClick={() => navigate(`/patients?patient=${it.patientId}`)}
                    className="hover:text-[#006D77] hover:underline text-left"
                  >
                    {it.ref}
                  </button>
                ) : (
                  it.ref
                )}
              </div>
              <div className="text-xs text-[#64748B] truncate">{it.category} · {new Date(it.date).toLocaleDateString()}</div>
            </div>
          </div>
          <div
            className="font-bold text-sm shrink-0 ml-3"
            style={{ color: it.type === 'income' ? '#059669' : '#E11D48' }}
          >
            {it.type === 'income' ? '+' : '−'}{formatCurrency(it.amount, currency)}
          </div>
        </div>
      ))}
    </div>
  );
}
