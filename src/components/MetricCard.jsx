import React from 'react';

const TONES = {
  income: { color: '#059669', bg: '#ECFDF5' },
  expense: { color: '#E11D48', bg: '#FFF1F2' },
  teal: { color: '#006D77', bg: '#E0F2F1' },
};

export default function MetricCard({ label, value, tone = 'teal', icon: Icon, subtitle }) {
  const t = TONES[tone] || TONES.teal;
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 border border-gray-100">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: t.bg, color: t.color }}
      >
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div className="min-w-0">
        <div className="text-sm text-[#64748B] font-medium">{label}</div>
        <div className="text-xl font-bold truncate" style={{ color: t.color }}>
          {value}
        </div>
        {subtitle && <div className="text-xs text-[#64748B] mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
