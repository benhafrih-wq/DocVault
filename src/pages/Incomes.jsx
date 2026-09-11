import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncomes, useExpenses, useClinicProfile, formatCurrency, inTimeframe } from '@/lib/useClinic';
import IncomeForm from '@/components/IncomeForm';
import CategoryDonutChart from '@/components/CategoryDonutChart';
import TimeframeFilter from '@/components/TimeframeFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, TrendingUp, Search, Download } from 'lucide-react';
import { exportFinancialReportCSV } from '@/lib/exportUtils';

const TEAL_PALETTE = ['#006D77', '#0E9594', '#2A9D8F', '#4FB3A9', '#48CAE4', '#59B8AC', '#00838F', '#8ECAE6', '#83C5BE', '#B7E3DC'];

const STATUS_TONES = {
  'Pending Insurance Claim': 'bg-amber-100 text-amber-700',
  'Partial Payment': 'bg-orange-100 text-orange-700',
};

export default function Incomes() {
  const navigate = useNavigate();
  const { data: incomes = [], isLoading } = useIncomes();
  const { data: expenses = [] } = useExpenses();
  const { data: clinic } = useClinicProfile();
  const [surgicalOpen, setSurgicalOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [timeframe, setTimeframe] = useState('this_month');
  const [catFilter, setCatFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  const periodIncomes = useMemo(
    () => incomes.filter((i) => inTimeframe(i.date, timeframe)),
    [incomes, timeframe]
  );

  const chartData = useMemo(() => {
    const map = new Map();
    periodIncomes.forEach((i) => {
      map.set(i.category, (map.get(i.category) || 0) + Number(i.amount || 0));
    });
    return [...map.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodIncomes]);

  const filtered = useMemo(() => {
    return periodIncomes.filter((i) => {
      if (catFilter !== 'all' && i.category !== catFilter) return false;
      const d = i.date?.slice(0, 10);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${i.patient_id} ${i.patient_name || ''} ${i.procedure_notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [periodIncomes, catFilter, fromDate, toDate, search]);

  const linkedTotals = useMemo(() => {
    const m = new Map();
    expenses.forEach((e) => {
      if (e.linked_income_id) {
        m.set(e.linked_income_id, (m.get(e.linked_income_id) || 0) + Number(e.amount || 0));
      }
    });
    return m;
  }, [expenses]);

  const total = filtered.reduce((s, i) => s + Number(i.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Incomes Ledger</h1>
          <p className="text-[#64748B] text-sm">Track all patient and procedure revenues</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => exportFinancialReportCSV(incomes, expenses, clinic?.currency)}>
            <Download className="w-4 h-4 mr-1" /> Export Financial Report
          </Button>
          <Button onClick={() => setSurgicalOpen(true)} className="bg-[#006D77] hover:bg-[#005a63]">
            <Plus className="w-4 h-4 mr-1" /> Surgical Income
          </Button>
          <Button onClick={() => setIncomeOpen(true)} className="bg-[#2A9D8F] hover:bg-[#238a7e]">
            <Plus className="w-4 h-4 mr-1" /> Income
          </Button>
        </div>
      </div>

      {/* Category distribution chart */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h2 className="font-semibold text-[#1E293B]">Income by Category</h2>
          <TimeframeFilter value={timeframe} onChange={setTimeframe} />
        </div>
        <CategoryDonutChart
          data={chartData}
          palette={TEAL_PALETTE}
          currency={clinic?.currency}
          selected={catFilter === 'all' ? null : catFilter}
          onSelect={(name) => setCatFilter(name || 'all')}
        />
      </div>

      {/* Summary banner */}
      <div className="bg-gradient-to-r from-[#006D77] to-[#00838f] text-white rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-white/80">Filtered Total Income</div>
          <div className="text-2xl font-bold">{formatCurrency(total, clinic?.currency)}</div>
        </div>
        <TrendingUp className="w-10 h-10 text-white/40" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] font-medium">Category</label>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {chartData.map((c) => (
                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] font-medium">From date</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] font-medium">To date</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] font-medium">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patient / notes" className="pl-9" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[#64748B] text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-[#64748B] text-sm">No income records match your filters.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((i) => {
              const cost = linkedTotals.get(i.id);
              const net = cost != null ? Number(i.amount) - cost : null;
              return (
                <div key={i.id} className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/patients?patient=${i.patient_id}`)}
                        className="font-semibold text-sm text-[#1E293B] hover:text-[#006D77] hover:underline text-left"
                      >
                        {i.patient_name || i.patient_id}
                      </button>
                      {i.is_surgical && (
                        <span className="text-[10px] font-semibold text-white bg-[#006D77] rounded-full px-2 py-0.5">
                          Surgical
                        </span>
                      )}
                      {i.payment_status && (
                        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${STATUS_TONES[i.payment_status] || 'bg-emerald-100 text-emerald-700'}`}>
                          {i.payment_status}
                        </span>
                      )}
                      {net != null && (
                        <span className="text-[10px] font-semibold text-[#006D77] bg-[#E0F2F1] rounded-full px-2 py-0.5">
                          Net {formatCurrency(net, clinic?.currency)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      {i.category} · {new Date(i.date).toLocaleDateString()} · {i.payment_method}
                      {i.anatomy ? ` · ${i.anatomy}` : ''}
                      {i.surgical_facility ? ` · ${i.surgical_facility}` : ''}
                    </div>
                    {i.procedure_notes && <div className="text-xs text-[#64748B] mt-1 truncate">{i.procedure_notes}</div>}
                  </div>
                  <div className="font-bold text-sm shrink-0" style={{ color: '#059669' }}>
                    +{formatCurrency(i.amount, clinic?.currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <IncomeForm open={surgicalOpen} onOpenChange={setSurgicalOpen} mode="surgical" />
      <IncomeForm open={incomeOpen} onOpenChange={setIncomeOpen} mode="income" />
    </div>
  );
}
