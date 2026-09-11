import React from 'react';
import { Plus, Receipt } from 'lucide-react';

export default function QuickActions({ onSurgicalIncome, onIncome, onExpense }) {
  const buttons = [
    { label: 'Surgical Income', icon: Plus, className: 'bg-[#006D77] hover:bg-[#005a63] text-white', onClick: onSurgicalIncome },
    { label: 'Income', icon: Plus, className: 'bg-[#2A9D8F] hover:bg-[#238a7e] text-white', onClick: onIncome },
    { label: 'Expense', icon: Receipt, className: 'bg-[#E11D48] hover:bg-[#c4183f] text-white', onClick: onExpense },
  ];

  return (
    <div className="flex gap-2.5 flex-wrap">
      {buttons.map((b) => (
        <button
          key={b.label}
          onClick={b.onClick}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition active:scale-95 ${b.className}`}
        >
          <b.icon className="w-4 h-4 shrink-0" />
          {b.label}
        </button>
      ))}
    </div>
  );
}
