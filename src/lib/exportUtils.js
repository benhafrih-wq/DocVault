import moment from 'moment';

function toCSV(rows) {
  return rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function downloadCSVText(csv, filename) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildMonthlySummaryCSV(incomes, expenses, currency = 'DZD') {
  const byMonth = {};
  const key = (d) => (d ? moment(d).format('YYYY-MM') : 'unknown');
  const bucket = (d) => {
    const k = key(d);
    if (!byMonth[k]) byMonth[k] = { income: 0, expense: 0 };
    return byMonth[k];
  };
  incomes.forEach((i) => { bucket(i.date).income += Number(i.amount || 0); });
  expenses.forEach((e) => { bucket(e.date).expense += Number(e.amount || 0); });
  const rows = [['Month', `Income (${currency})`, `Expenses (${currency})`, `Net (${currency})`]];
  Object.keys(byMonth).sort().forEach((m) => {
    const { income, expense } = byMonth[m];
    rows.push([m, income.toFixed(2), expense.toFixed(2), (income - expense).toFixed(2)]);
  });
  return toCSV(rows);
}

export function exportFinancialReportCSV(incomes, expenses, currency = 'DZD') {
  downloadCSVText(
    buildMonthlySummaryCSV(incomes, expenses, currency),
    `financial-report-${moment().format('YYYYMMDD')}.csv`
  );
}

export function buildTaxCSV(expenses, currency = 'DZD') {
  const rows = [['Date', 'Vendor Name', 'Category', `Amount (${currency})`, 'Tax Deductible', 'Tax Reference / Invoice #', 'Receipt File']];
  expenses.forEach((e) => {
    rows.push([
      e.date?.slice(0, 10),
      e.vendor_name,
      e.category,
      Number(e.amount || 0).toFixed(2),
      e.tax_deductible ? 'Yes' : 'No',
      e.tax_reference || '',
      e.receipt_url || '',
    ]);
  });
  return toCSV(rows);
}