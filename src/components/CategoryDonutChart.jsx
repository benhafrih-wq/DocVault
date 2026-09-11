import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/useClinic';

export default function CategoryDonutChart({ data, palette, currency, selected, onSelect }) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  if (!total) {
    return <p className="text-sm text-[#64748B] py-10 text-center">No data for this period.</p>;
  }
  const toggle = (name) => onSelect(selected === name ? null : name);

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
      <div className="w-44 h-44 shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              innerRadius="62%"
              outerRadius="95%"
              paddingAngle={2}
              strokeWidth={0}
              onClick={(entry) => toggle(entry?.name || entry?.payload?.name)}
              className="cursor-pointer"
            >
              {data.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={palette[i % palette.length]}
                  opacity={selected && selected !== d.name ? 0.3 : 1}
                />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(v, currency)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-wide text-[#64748B]">Total</span>
          <span className="text-sm font-bold text-[#1E293B]">{formatCurrency(total, currency)}</span>
        </div>
      </div>
      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {data.map((d, i) => (
          <button
            key={d.name}
            type="button"
            onClick={() => toggle(d.name)}
            className={`flex items-center gap-2 text-left px-2 py-1.5 rounded-lg transition ${
              selected === d.name ? 'bg-gray-100' : 'hover:bg-gray-50'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: palette[i % palette.length] }} />
            <span className="text-xs font-medium text-[#1E293B] truncate flex-1">{d.name}</span>
            <span className="text-xs text-[#64748B] shrink-0">{Math.round((d.amount / total) * 100)}%</span>
            <span className="text-xs font-semibold text-[#1E293B] shrink-0">{formatCurrency(d.amount, currency)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
