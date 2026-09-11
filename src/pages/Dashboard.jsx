import React, { useState, useMemo } from 'react';
import { useIncomes, useExpenses, useClinicProfile, formatCurrency } from '@/lib/useClinic';
import MetricCard from '@/components/MetricCard';
import QuickActions from '@/components/QuickActions';
import CashFlowChart from '@/components/CashFlowChart';
import RecentActivity from '@/components/RecentActivity';
import IncomeForm from '@/components/IncomeForm';
import ExpenseForm from '@/components/ExpenseForm';
import { Wallet, TrendingUp, Receipt, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CHART_RANGES } from '@/lib/useClinic';
import { exportFinancialReportCSV } from '@/lib/exportUtils';

export default function Dashboard() {
  const { data: incomes = [] } = useIncomes();
  const { data: expenses = [] } = useExpenses();
  const { data: clinic } = useClinicProfile();
  const [surgicalOpen, setSurgicalOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [chartRange, setChartRange] = useState('month');

  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + Number(i.amount || 0), 0), [incomes]);
  const surgicalIncome = useMemo(() => incomes.filter((i) => i.is_surgical).reduce((s, i) => s + Number(i.amount || 0), 0), [incomes]);
  const totalExpense = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]);
  const net = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Financial Dashboard</h1>
          <p className="text-[#64748B] text-sm">Overview of your clinic's financial activity</p>
        </div>
        <Button variant="outline" onClick={() => exportFinancialReportCSV(incomes, expenses, clinic?.currency)}>
          <Download className="w-4 h-4 mr-1" /> Export Financial Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Net Revenue" value={formatCurrency(net, clinic?.currency)} tone={net >= 0 ? 'income' : 'expense'} icon={Wallet} />
        <MetricCard label="Total Surgical Income" value={formatCurrency(surgicalIncome, clinic?.currency)} tone="teal" icon={TrendingUp} />
        <MetricCard label="Total Clinic Expenses" value={formatCurrency(totalExpense, clinic?.currency)} tone="expense" icon={Receipt} />
      </div>

      <QuickActions
        onSurgicalIncome={() => setSurgicalOpen(true)}
        onIncome={() => setIncomeOpen(true)}
        onExpense={() => setExpenseOpen(true)}
      />

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h2 className="font-semibold text-[#1E293B]">Cash Flow</h2>
          <Select value={chartRange} onValueChange={setChartRange}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CHART_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CashFlowChart incomes={incomes} expenses={expenses} range={chartRange} />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
        <h2 className="font-semibold text-[#1E293B] mb-2">Recent Activity</h2>
        <RecentActivity incomes={incomes} expenses={expenses} currency={clinic?.currency} />
      </div>

      <IncomeForm open={surgicalOpen} onOpenChange={setSurgicalOpen} mode="surgical" />
      <IncomeForm open={incomeOpen} onOpenChange={setIncomeOpen} mode="income" />
      <ExpenseForm open={expenseOpen} onOpenChange={setExpenseOpen} />
    </div>
  );
}