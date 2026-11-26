export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(dateIso: string, days: number): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  const ry = dt.getFullYear();
  const rm = String(dt.getMonth() + 1).padStart(2, '0');
  const rd = String(dt.getDate()).padStart(2, '0');
  return `${ry}-${rm}-${rd}`;
}

export function diffDaysISO(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  const a = Date.UTC(y1, (m1 || 1) - 1, d1 || 1);
  const b = Date.UTC(y2, (m2 || 1) - 1, d2 || 1);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

const BULAN_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export function formatDateID(dateIso: string | null | undefined): string {
  if (!dateIso) return '—';
  const parts = dateIso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateIso;
  const [y, m, d] = parts;
  return `${String(d).padStart(2, '0')} ${BULAN_ID[(m - 1) % 12]} ${y}`;
}

export function formatMonthYearID(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number);
  if (!y || !m) return yyyyMm;
  return `${BULAN_ID[(m - 1) % 12]} ${y}`;
}

export function formatCurrencyIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'LR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (/[",\n;]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvLines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const bom = '\uFEFF';
  const blob = new Blob([bom + csvLines], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
