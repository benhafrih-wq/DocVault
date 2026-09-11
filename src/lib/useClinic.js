import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const INCOME_CATEGORIES = [
  "Outpatient Consultation",
  "PRP / Joint Infiltration",
  "Ultrasound / Imaging",
  "X-Ray / Radiography",
  "Bracing & Immobilization",
];

export const SURGICAL_CATEGORIES = [
  "Joint Replacement (Arthroplasty)",
  "Arthroscopic Surgery",
  "Fracture / Trauma Fixation",
  "Spine / Disc Surgery",
  "Soft Tissue / Ligament Repair",
];

export const EXPENSE_CATEGORIES = [
  "Surgical Supplies & Implants",
  "Clinical Equipment & Maintenance",
  "Facility Rent & Utilities",
  "Pharmaceuticals & Injections Stock",
  "Staff & Administrative",
];

export const PAYMENT_METHODS = ["Cash", "Insurance Claim", "Bank Transfer"];
export const PAYMENT_STATUSES = ["Paid in Cash", "Paid in Full", "Pending Insurance Claim", "Partial Payment"];
export const ANATOMY_OPTIONS = ["Knee", "Hip", "Shoulder", "Spine", "Trauma/Fracture", "Other"];
export const PATIENT_JOINTS = ["Knee", "Hip", "Shoulder", "Spine", "Ankle/Foot", "Hand/Wrist", "General Trauma", "Other"];
export const GENDERS = ["Male", "Female"];
export const CURRENCIES = ["DZD", "EUR", "USD", "GBP"];

export const TIMEFRAMES = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_quarter', label: 'Last Quarter (3 Months)' },
  { value: 'ytd', label: 'Year-to-Date' },
  { value: 'all_time', label: 'All Time' },
];

export const CHART_RANGES = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
  { value: 'all_time', label: 'All Time' },
];

export function timeframeStart(timeframe) {
  const now = new Date();
  if (timeframe === 'this_month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (timeframe === 'last_quarter') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 2);
    d.setDate(1);
    return d;
  }
  if (timeframe === 'ytd') return new Date(now.getFullYear(), 0, 1);
  return null;
}

export function inTimeframe(dateStr, timeframe) {
  if (!timeframe || timeframe === 'all_time') return true;
  const start = timeframeStart(timeframe);
  return start ? new Date(dateStr) >= start : true;
}

export function useClinicProfile() {
  return useQuery({
    queryKey: ['clinicProfile'],
    queryFn: async () => {
      const list = await base44.entities.ClinicProfile.list();
      return list[0] || null;
    },
  });
}

export function useIncomes() {
  return useQuery({
    queryKey: ['incomes'],
    queryFn: async () => base44.entities.Income.list('-date', 500),
  });
}

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => base44.entities.Expense.list('-date', 500),
  });
}

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => base44.entities.Patient.list('-created_date', 500),
  });
}

export function useCustomCategories(type) {
  return useQuery({
    queryKey: ['customCategories', type],
    queryFn: async () => {
      const all = await base44.entities.CustomCategory.list();
      return type ? all.filter((c) => c.type === type) : all;
    },
  });
}

export function nextPatientCode(patients = []) {
  let max = 0;
  patients.forEach((p) => {
    const m = /(\d+)$/.exec(p.patient_code || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  });
  return `PT-${String(max + 1).padStart(4, '0')}`;
}

export function currencySymbol(currency) {
  if (!currency || currency === 'DZD') return 'DA';
  return currency;
}

export function formatCurrency(amount, currency = 'DZD') {
  const value = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value} ${currencySymbol(currency)}`;
}

export function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}