import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import moment from 'moment';

const RANGE_CONFIG = {
  day: {
    unit: 'day', count: 30,
    keyFn: (m) => m.format('YYYY-MM-DD'),
    labelFn: (m) => m.format('MMM D'),
  },
  week: {
    unit: 'week', count: 12,
    keyFn: (m) => m.clone().startOf('week').format('YYYY-MM-DD'),
    labelFn: (m) => m.format('MMM D'),
  },
  month: {
    unit: 'month', count: 12,
    keyFn: (m) => m.format('YYYY-MM'),
    labelFn: (m) => m.format('MMM YY'),
  },
  year: {
    unit: 'year', count: 5,
    keyFn: (m) => m.format('YYYY'),
    labelFn: (m) => m.format('YYYY'),
  },
};

export default function CashFlowChart({ incomes = [], expenses = [], range = 'month' }) {
  const data = useMemo(() => {
    if (range === 'all_time') {
      const allDates = [...incomes, ...expenses].map((x) => moment(x.date)).filter((d) => d.isValid());
      if (allDates.length === 0) return [];
      const earliest = moment.min(allDates).clone().startOf('year');
      const latest = moment().endOf('year');
      const years = [];
      let cursor = earliest.clone();
      while (cursor.isSameOrBefore(latest, 'year')) {
        years.push({ key: cursor.format('YYYY'), label: cursor.format('YYYY'), income: 0, expense: 0 });
        cursor.add(1, 'year');
      }
      incomes.forEach((inc) => {
        const slot = years.find((x) => x.key === moment(inc.date).format('YYYY'));
        if (slot) slot.income += Number(inc.amount || 0);
      });
      expenses.forEach((exp) => {
        const slot = years.find((x) => x.key === moment(exp.date).format('YYYY'));
        if (slot) slot.expense += Number(exp.amount || 0);
      });
      return years;
    }

    const cfg = RANGE_CONFIG[range] || RANGE_CONFIG.month;
    const buckets = [];
    for (let i = cfg.count - 1; i >= 0; i--) {
      const m = moment().subtract(i, cfg.unit);
      buckets.push({ key: cfg.keyFn(m), label: cfg.labelFn(m), income: 0, expense: 0 });
    }
    incomes.forEach((inc) => {
      const slot = buckets.find((x) => x.key === cfg.keyFn(moment(inc.date)));
      if (slot) slot.income += Number(inc.amount || 0);
    });
    expenses.forEach((exp) => {
      const slot = buckets.find((x) => x.key === cfg.keyFn(moment(exp.date)));
      if (slot) slot.expense += Number(exp.amount || 0);
    });
    return buckets;
  }, [incomes, expenses, range]);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={6}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={20} />
        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={60} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
          formatter={(v) => v.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} iconType="circle" />
        <Bar dataKey="income" name="Income" fill="#059669" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expense" name="Expense" fill="#E11D48" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
