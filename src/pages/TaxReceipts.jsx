import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import moment from 'moment';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useExpenses, useClinicProfile, formatCurrency } from '@/lib/useClinic';
import { buildTaxCSV } from '@/lib/exportUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2, ZoomIn, ZoomOut, FileText, FileCheck2 } from 'lucide-react';
import { Image } from '@/components/ui/image';

const isImageUrl = (url) => /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(url || '');
const QUARTERS = [
  { value: 'all', label: 'All quarters' },
  { value: '1', label: 'Q1 (Jan–Mar)' },
  { value: '2', label: 'Q2 (Apr–Jun)' },
  { value: '3', label: 'Q3 (Jul–Sep)' },
  { value: '4', label: 'Q4 (Oct–Dec)' },
];

export default function TaxReceipts() {
  const qc = useQueryClient();
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: clinic } = useClinicProfile();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [quarter, setQuarter] = useState('all');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [deductible, setDeductible] = useState(false);
  const [taxRef, setTaxRef] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [exporting, setExporting] = useState(false);

  const receipts = useMemo(() => expenses.filter((e) => e.receipt_url), [expenses]);
  const years = useMemo(
    () => [...new Set(receipts.map((r) => String(moment(r.date).year())))].sort((a, b) => b - a),
    [receipts]
  );
  const categories = useMemo(
    () => [...new Set(receipts.map((r) => r.category).filter(Boolean))].sort(),
    [receipts]
  );

  const yearReceipts = useMemo(
    () => receipts.filter((r) => String(moment(r.date).year()) === year),
    [receipts, year]
  );

  const filtered = useMemo(() => {
    return yearReceipts.filter((r) => {
      if (quarter !== 'all' && moment(r.date).quarter() !== Number(quarter)) return false;
      if (category !== 'all' && r.category !== category) return false;
      return true;
    });
  }, [yearReceipts, quarter, category]);

  const openReceipt = (r) => {
    setSelected(r);
    setZoom(1);
    setDeductible(!!r.tax_deductible);
    setTaxRef(r.tax_reference || '');
  };

  const saveMeta = async () => {
    if (!selected) return;
    setSavingMeta(true);
    try {
      await base44.entities.Expense.update(selected.id, {
        tax_deductible: deductible,
        tax_reference: taxRef.trim() || undefined,
      });
      await qc.invalidateQueries({ queryKey: ['expenses'] });
      setSelected(null);
    } finally {
      setSavingMeta(false);
    }
  };

  const exportPackage = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      for (const r of yearReceipts) {
        try {
          const res = await fetch(r.receipt_url);
          if (!res.ok) continue;
          const blob = await res.blob();
          const ext = (r.receipt_url.split('.').pop() || 'jpg').split('?')[0];
          const safeVendor = (r.vendor_name || 'receipt').replace(/[^a-z0-9]+/gi, '-');
          zip.file(`${moment(r.date).format('YYYYMMDD')}_${safeVendor}.${ext}`, blob);
        } catch (err) {
          // skip receipts that can't be fetched
        }
      }
      zip.file('tax-report.csv', '\ufeff' + buildTaxCSV(yearReceipts, clinic?.currency));
      const out = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(out);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-package-${year}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Tax Receipts</h1>
          <p className="text-[#64748B] text-sm">Audit receipts and prepare your accountant's tax package</p>
        </div>
        <Button onClick={exportPackage} disabled={exporting || yearReceipts.length === 0} className="bg-[#006D77] hover:bg-[#005a63]">
          {exporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
          {exporting ? 'Preparing package...' : 'Export Tax Package'}
        </Button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] font-medium">Fiscal Year</label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(years.length ? years : [String(new Date().getFullYear())]).map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] font-medium">Quarter</label>
          <Select value={quarter} onValueChange={setQuarter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {QUARTERS.map((q) => (
                <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-[#64748B] font-medium">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Receipt gallery */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-[#64748B] text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileCheck2 className="w-10 h-10 text-[#83C5BE] mx-auto mb-3" />
          <p className="text-sm text-[#64748B]">
            No receipts found for this period. Attach receipts when logging expenses to build your tax archive.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => openReceipt(r)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left hover:shadow-md hover:border-[#83C5BE] transition"
            >
              {isImageUrl(r.receipt_url) ? (
                <Image src={r.receipt_url} alt="Receipt" className="w-full h-40 bg-gray-50" />
              ) : (
                <div className="w-full h-40 bg-gray-50 flex flex-col items-center justify-center text-[#64748B]">
                  <FileText className="w-10 h-10 mb-1" />
                  <span className="text-xs">PDF receipt</span>
                </div>
              )}
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-[#1E293B] truncate">{r.vendor_name}</span>
                  <span className="text-sm font-bold text-[#E11D48] shrink-0">{formatCurrency(r.amount, clinic?.currency)}</span>
                </div>
                <div className="text-xs text-[#64748B] truncate">
                  {new Date(r.date).toLocaleDateString()} · {r.category}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {r.tax_deductible ? (
                    <span className="text-[10px] font-semibold text-[#006D77] bg-[#E0F2F1] rounded-full px-2 py-0.5">Tax deductible</span>
                  ) : (
                    <span className="text-[10px] font-semibold text-[#64748B] bg-gray-100 rounded-full px-2 py-0.5">Not deductible</span>
                  )}
                  {r.tax_reference && (
                    <span className="text-[10px] text-[#64748B] truncate">#{r.tax_reference}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Receipt detail modal with zoom + tax metadata */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3 flex-wrap">
              <span>{selected?.vendor_name} · {selected && new Date(selected.date).toLocaleDateString()}</span>
              {isImageUrl(selected?.receipt_url) && (
                <span className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(z - 0.25, 1))}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-1">
              <div className="bg-gray-50 rounded-lg overflow-auto max-h-[55vh] flex justify-center">
                {isImageUrl(selected.receipt_url) ? (
                  <img
                    src={selected.receipt_url}
                    alt="Receipt"
                    className="max-w-full transition-transform duration-150"
                    style={{ transform: `scale(${zoom})` }}
                  />
                ) : (
                  <iframe src={selected.receipt_url} title="Receipt" className="w-full h-[50vh] border-0" />
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-[10px] uppercase text-[#64748B]">Date</div>
                  <div className="font-semibold text-[#1E293B]">{new Date(selected.date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[#64748B]">Vendor</div>
                  <div className="font-semibold text-[#1E293B] truncate">{selected.vendor_name}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[#64748B]">Category</div>
                  <div className="font-semibold text-[#1E293B] truncate">{selected.category}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[#64748B]">Amount</div>
                  <div className="font-semibold text-[#E11D48]">{formatCurrency(selected.amount, clinic?.currency)}</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
                <h3 className="font-semibold text-sm text-[#1E293B]">Tax Metadata</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tax-deductible"
                    checked={deductible}
                    onCheckedChange={(v) => setDeductible(!!v)}
                  />
                  <Label htmlFor="tax-deductible" className="text-sm font-normal cursor-pointer">Tax Deductible</Label>
                </div>
                <div className="space-y-1.5">
                  <Label>Tax Reference / Invoice #</Label>
                  <Input value={taxRef} onChange={(e) => setTaxRef(e.target.value)} placeholder="Optional" />
                </div>
                <Button onClick={saveMeta} disabled={savingMeta} className="bg-[#006D77] hover:bg-[#005a63]">
                  {savingMeta ? 'Saving...' : 'Save Tax Metadata'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
