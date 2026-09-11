import React, { useState, useMemo } from 'react';
import { useExpenses, useClinicProfile, useCustomCategories, formatCurrency, inTimeframe, EXPENSE_CATEGORIES } from '@/lib/useClinic';
import ExpenseForm from '@/components/ExpenseForm';
import ReceiptModal from '@/components/ReceiptModal';
import CategoryDonutChart from '@/components/CategoryDonutChart';
import TimeframeFilter from '@/components/TimeframeFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Receipt, Paperclip, Search } from 'lucide-react';

const CORAL_PALETTE = ['#E11D48', '#FB7185', '#F97316', '#C2410C', '#F43F5E', '#FDA4AF', '#FB923C', '#9F1239', '#EA8C55', '#FF8FA3'];

export default function Expenses() {
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: customs = [] } = useCustomCategories('expense');
  const { data: clinic } = useClinicProfile();
  const [open, setOpen] = useState(false);
  const [timeframe, setTimeframe] = useState('this_month');
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [receiptUrl, setReceiptUrl] = useState(null);

  const categoryOptions = useMemo(
    () => [...new Set([...EXPENSE_CATEGORIES, ...customs.map((c) => c.name)])],
    [customs]
  );

  const periodExpenses = useMemo(
    () => expenses.filter((e) => inTimeframe(e.date, timeframe)),
    [expenses, timeframe]
  );

  const chartData = useMemo(() => {
    const map = new Map();
    periodExpenses.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + Number(e.amount || 0));
    });
    return [...map.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodExpenses]);

  const filtered = useMemo(() => {
    return periodExpenses.filter((e) => {
      if (catFilter !== 'all' && e.category !== catFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.vendor_name} ${e.notes || ''} ${e.category || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [periodExpenses, catFilter, search]);

  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Expenses Ledger</h1>
          <p className="text-[#64748B] text-sm">Track overhead, supplies, and operational costs</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-[#E11D48] hover:bg-[#c4183f]">
          <Plus className="w-4 h-4 mr-1" /> Add Expense
        </Button>
      </div>

      {/* Category distribution chart */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h2 className="font-semibold text-[#1E293B]">Expenses by Category</h2>
          <TimeframeFilter value={timeframe} onChange={setTimeframe} />
        </div>
        <CategoryDonutChart
          data={chartData}
          palette={CORAL_PALETTE}
          currency={clinic?.currency}
          selected={catFilter === 'all' ? null : catFilter}
          onSelect={(name) => setCatFilter(name || 'all')}
        />
      </div>

      {/* Summary banner */}
      <div className="bg-gradient-to-r from-[#E11D48] to-[#be123c] text-white rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-white/80">Filtered Total Expenses</div>
          <div className="text-2xl font-bold">{formatCurrency(total, clinic?.currency)}</div>
        </div>
        <Receipt className="w-10 h-10 text-white/40" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] font-medium">Category</label>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {[...new Set([...categoryOptions, ...chartData.map((c) => c.name)])].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] font-medium">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Vendor / category / notes" className="pl-9" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[#64748B] text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-[#64748B] text-sm">No expense records match your filters.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((e) => (
              <div key={e.id} className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#1E293B]">{e.vendor_name}</span>
                    {e.receipt_url && (
                      <button
                        onClick={() => setReceiptUrl(e.receipt_url)}
                        className="inline-flex items-center gap-1 text-xs text-[#006D77] hover:underline"
                      >
                        <Paperclip className="w-3 h-3" /> Receipt
                      </button>
                    )}
                    {e.tax_deductible && (
                      <span className="text-[10px] font-semibold text-[#006D77] bg-[#E0F2F1] rounded-full px-2 py-0.5">
                        Tax deductible
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#64748B] mt-0.5">
                    {e.category} · {new Date(e.date).toLocaleDateString()}
                  </div>
                  {e.notes && <div className="text-xs text-[#64748B] mt-1 truncate">{e.notes}</div>}
                </div>
                <div className="font-bold text-sm shrink-0" style={{ color: '#E11D48' }}>
                  −{formatCurrency(e.amount, clinic?.currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExpenseForm open={open} onOpenChange={setOpen} />
      <ReceiptModal open={!!receiptUrl} onOpenChange={(v) => !v && setReceiptUrl(null)} url={receiptUrl} />
    </div>
  );
}