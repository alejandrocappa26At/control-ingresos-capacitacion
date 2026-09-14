import { format, isValid, parse, formatISO } from 'date-fns';

export const EMPTY_ISO = '';

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function excelSerialToDate(serial: number): Date | null {
  if (!isFinite(serial) || serial <= 0 || serial > 100000) return null;
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const days = Math.floor(serial);
  const frac = serial - days;
  const date = new Date(epoch.getTime() + days * 86400000);
  if (frac > 0) {
    date.setTime(date.getTime() + Math.round(frac * 86400000));
  }
  return isValid(date) ? date : null;
}

function tryParseStringDate(value: string): Date | null {
  const trimmed = value.trim();

  const patterns: Array<[string, string]> = [
    ['iiii/MM/yyyy', 'dd/MM/yyyy'],
    ['iiii-MM-yyyy', 'dd-MM-yyyy'],
    ['yyyy-MM-dd', 'yyyy-MM-dd'],
    ['yyyy/MM/dd', 'yyyy/MM/dd'],
    ['iiii.MM.yyyy', 'dd.MM.yyyy'],
  ];

  for (const [template] of patterns) {
    const parsed = parse(trimmed, template, new Date());
    if (isValid(parsed)) return parsed;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [dd, mm, yyyy] = trimmed.split('/');
    const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (isValid(parsed)) return parsed;
  }

  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const [dd, mm, yyyy] = trimmed.split('-');
    const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (isValid(parsed)) return parsed;
  }

  const asDate = new Date(trimmed);
  if (isValid(asDate)) return asDate;

  return null;
}

export function normalizeDateValue(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    const fixed = new Date(value.getTime() + value.getTimezoneOffset() * 60000);
    return isValid(fixed) ? fixed : null;
  }

  if (typeof value === 'number') {
    return excelSerialToDate(value);
  }

  const text = String(value).trim();
  if (!text || /^(pendiente|sin registro|-|n\/a)$/i.test(text)) return null;

  return tryParseStringDate(text);
}

export function toDisplayDate(value: unknown): string {
  const date = normalizeDateValue(value);
  if (!date) return EMPTY_ISO;
  return format(date, 'dd/MM/yyyy');
}

export function toISODate(value: unknown): string {
  const date = normalizeDateValue(value);
  if (!date) return EMPTY_ISO;
  return formatISO(date, { representation: 'date' });
}

export function todayISO(): string {
  return formatISO(new Date(), { representation: 'date' });
}

export function addDaysISO(iso: string, days: number): string {
  if (!iso) return iso;
  const date = parse(iso, 'yyyy-MM-dd', new Date());
  date.setDate(date.getDate() + days);
  return formatISO(date, { representation: 'date' });
}

export function isoYear(iso: string): string {
  if (!iso) return '';
  return iso.slice(0, 4);
}

export function isoMonth(iso: string): string {
  if (!iso) return '';
  return iso.slice(0, 7);
}

export function matchesDateFilter(iso: string, filter: { type: string; day?: string; month?: string; year?: string; from?: string; to?: string }): boolean {
  if (!iso) return true;
  if (!filter || filter.type === 'all') return true;

  switch (filter.type) {
    case 'day':
      return filter.day ? iso === filter.day : true;
    case 'month':
      return filter.month ? isoMonth(iso) === filter.month : true;
    case 'year':
      return filter.year ? isoYear(iso) === filter.year : true;
    case 'range':
      if (filter.from && iso < filter.from) return false;
      if (filter.to && iso > filter.to) return false;
      return true;
    default:
      return true;
  }
}

export function diasEntre(desdeISO: string, hastaISO: string): number {
  if (!desdeISO || !hastaISO) return 0;
  const a = parse(desdeISO, 'yyyy-MM-dd', new Date());
  const b = parse(hastaISO, 'yyyy-MM-dd', new Date());
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function ddmmyyyy(iso: string): string {
  if (!iso) return '—';
  const date = parse(iso, 'yyyy-MM-dd', new Date());
  return isValid(date) ? format(date, 'dd/MM/yyyy') : iso;
}

export function prettyDay(iso: string): string {
  if (!iso) return '—';
  const date = parse(iso, 'yyyy-MM-dd', new Date());
  return isValid(date) ? format(date, 'dd MMM yyyy') : iso;
}

export function fullMonthYear(month: string): string {
  if (!month) return '';
  const date = parse(month, 'yyyy-MM', new Date());
  return isValid(date) ? format(date, "MMMM 'de' yyyy") : month;
}

export function firstDayOfMonth(): string {
  const now = new Date();
  return formatISO(new Date(now.getFullYear(), now.getMonth(), 1), { representation: 'date' });
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function currentYear(): string {
  return String(new Date().getFullYear());
}

export function parseDisplayToISO(value: string): string {
  if (!value) return '';
  const date = tryParseStringDate(value);
  return date ? formatISO(date, { representation: 'date' }) : value;
}

export function fechaHoraLarga(): string {
  return `${format(new Date(), 'dd/MM/yyyy')} ${format(new Date(), 'HH:mm')}`;
}

export function formatISOToDisplay(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  return isValid(date) ? format(date, 'dd/MM/yyyy HH:mm') : iso;
}

export function pad2(n: number) {
  return pad(n);
}

export { pad };