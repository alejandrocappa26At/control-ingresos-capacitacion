'use client';

import { useDataStore } from '@/store/useDataStore';
import { Label } from '@/components/ui/input';
import { normalizeKey, splitCapacitadores } from '@/lib/utils';
import type { DateFilterValue, FilterState, Promotor } from '@/types';

export function useUniqueValues(key: keyof Promotor, opts: { normalize?: boolean } = {}) {
  const records = useDataStore((s) => s.records);
  const set = new Set<string>();
  for (const r of records) {
    const value = r[key];
    if (typeof value !== 'string' || !value || value === '—') continue;
    const normalized = opts.normalize ? normalizeKey(value) : value;
    set.add(normalized);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

export function useCapacitadorOptions(): string[] {
  const records = useDataStore((s) => s.records);
  const set = new Set<string>();
  for (const r of records) {
    for (const token of splitCapacitadores(r.capacitador)) set.add(token);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
}

export const DATE_LABELS: Record<keyof Pick<FilterState, 'fechaIngreso' | 'inicioCapacitacion' | 'finCapacitacion' | 'entregaOperaciones'>, string> = {
  fechaIngreso: 'Fecha de ingreso',
  inicioCapacitacion: 'Fecha inicio capacitación',
  finCapacitacion: 'Fecha fin capacitación',
  entregaOperaciones: 'Fecha entrega operaciones',
};

export function yearsFromData(): string[] {
  const { records } = useDataStore.getState();
  const set = new Set<string>();
  for (const r of records) {
    const iso = r.fechasISO.fechaIngreso;
    if (iso) set.add(iso.slice(0, 4));
  }
  return Array.from(set).sort().reverse();
}

export interface DateFilterInputProps {
  label: string;
  value: DateFilterValue;
  onChange: (v: DateFilterValue) => void;
}

export function DateFilterInput({ label, value, onChange }: DateFilterInputProps) {
  const mode = value.type;
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {(['all', 'day', 'month', 'year', 'range'] as const).map((t) => (
          <button
            key={t}
            onClick={() => onChange({ ...value, type: t })}
            className={
              'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-300 ' +
              (mode === t
                ? 'gradient-brand text-white shadow-glow-sm'
                : 'bg-surface/60 text-ink-soft hover:bg-surface-3 hover:text-ink')
            }
          >
            {t === 'all' ? 'Todo' : t === 'day' ? 'Día' : t === 'month' ? 'Mes' : t === 'year' ? 'Año' : 'Rango'}
          </button>
        ))}
      </div>
      {mode === 'day' && (
        <input
          type="date"
          className="mt-2 h-10 w-full rounded-xl border border-line bg-surface/60 px-3 text-sm text-ink backdrop-blur transition-all duration-300 focus:border-brand-400/70 focus:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          value={value.day ?? ''}
          onChange={(e) => onChange({ type: 'day', day: e.target.value })}
        />
      )}
      {mode === 'month' && (
        <input
          type="month"
          className="mt-2 h-10 w-full rounded-xl border border-line bg-surface/60 px-3 text-sm text-ink backdrop-blur transition-all duration-300 focus:border-brand-400/70 focus:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          value={value.month ?? ''}
          onChange={(e) => onChange({ type: 'month', month: e.target.value })}
        />
      )}
      {mode === 'year' && (
        <select
          className="mt-2 h-10 w-full rounded-xl border border-line bg-surface/60 px-3 text-sm text-ink backdrop-blur transition-all duration-300 focus:border-brand-400/70 focus:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          value={value.year ?? ''}
          onChange={(e) => onChange({ type: 'year', year: e.target.value })}
        >
          <option value="">Seleccionar año</option>
          {yearsFromData().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      )}
      {mode === 'range' && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="date"
            className="h-10 w-full rounded-xl border border-line bg-surface/60 px-3 text-sm text-ink backdrop-blur transition-all duration-300 focus:border-brand-400/70 focus:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            value={value.from ?? ''}
            onChange={(e) => onChange({ type: 'range', from: e.target.value, to: value.to })}
          />
          <span className="text-xs text-ink-soft">a</span>
          <input
            type="date"
            className="h-10 w-full rounded-xl border border-line bg-surface/60 px-3 text-sm text-ink backdrop-blur transition-all duration-300 focus:border-brand-400/70 focus:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            value={value.to ?? ''}
            onChange={(e) => onChange({ type: 'range', from: value.from, to: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}