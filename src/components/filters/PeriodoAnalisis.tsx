'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CalendarRange, X } from 'lucide-react';
import { parse, format, differenceInCalendarDays, lastDayOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDataStore } from '@/store/useDataStore';
import { DateRangePicker } from '@/components/filters/DateRangePicker';
import {
  matchesDateFilter,
  currentMonth,
  currentYear,
  ddmmyyyy,
  fullMonthYear,
  monthBounds,
  currentQuarterRange,
  previousMonthISO,
} from '@/lib/dates';
import { formatNumber, cn } from '@/lib/utils';
import type { DateFilterValue } from '@/types';

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function isEqualFilter(a: DateFilterValue, b: DateFilterValue): boolean {
  if (a.type !== b.type) return false;
  const fields: Array<keyof DateFilterValue> = ['day', 'month', 'year', 'from', 'to'];
  return fields.every((k) => a[k] === b[k]);
}

function diasSeleccionados(value: DateFilterValue): number | null {
  if (value.type === 'day') return value.day ? 1 : null;
  if (value.type === 'month' && value.month) {
    const last = lastDayOfMonth(parse(value.month, 'yyyy-MM', new Date()));
    return last.getDate();
  }
  if (value.type === 'range' && value.from && value.to) {
    const a = parse(value.from, 'yyyy-MM-dd', new Date());
    const b = parse(value.to, 'yyyy-MM-dd', new Date());
    return differenceInCalendarDays(b, a) + 1;
  }
  if (value.type === 'year' && value.year) {
    const y = Number(value.year);
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return leap ? 366 : 365;
  }
  return null;
}

interface Preset {
  id: string;
  label: string;
  build: () => DateFilterValue;
}

const QUICK_PRESETS: Preset[] = [
  { id: 'mes', label: 'Mes actual', build: () => ({ type: 'month', month: currentMonth() }) },
  { id: 'mesAnterior', label: 'Mes anterior', build: () => ({ type: 'month', month: previousMonthISO() }) },
  { id: 'trimestre', label: 'Trimestre actual', build: () => ({ type: 'range', ...currentQuarterRange() }) },
  { id: 'anio', label: 'Año actual', build: () => ({ type: 'year', year: currentYear() }) },
];

export function PeriodoAnalisis(): React.JSX.Element {
  const records = useDataStore((s) => s.records);
  const filters = useDataStore((s) => s.filters);
  const setFilters = useDataStore((s) => s.setFilters);
  const [customOpen, setCustomOpen] = useState(false);

  const value = filters.fechaIngreso;
  const isActive = value.type !== 'all';

  const summary = useMemo(() => {
    if (value.type === 'day' && value.day) {
      const parsed = parse(value.day, 'yyyy-MM-dd', new Date());
      return {
        titulo: ddmmyyyy(value.day),
        detalle: capitalize(format(parsed, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })),
      };
    }
    if (value.type === 'month' && value.month) {
      const bounds = monthBounds(value.month);
      return {
        titulo: capitalize(fullMonthYear(value.month)),
        detalle: `Del ${ddmmyyyy(bounds.from)} al ${ddmmyyyy(bounds.to)}`,
      };
    }
    if (value.type === 'year' && value.year) {
      return {
        titulo: value.year,
        detalle: `Año fiscal completo · del 01/01/${value.year} al 31/12/${value.year}`,
      };
    }
    if (value.type === 'range' && value.from && value.to) {
      return {
        titulo: `${ddmmyyyy(value.from)} — ${ddmmyyyy(value.to)}`,
        detalle: 'Período personalizado',
      };
    }
    return {
      titulo: 'Todo el período',
      detalle: 'Sin filtro de fecha de ingreso',
    };
  }, [value]);

  const registros = useMemo(
    () => records.filter((r) => matchesDateFilter(r.fechasISO.fechaIngreso, value)).length,
    [records, value],
  );

  const dias = useMemo(() => diasSeleccionados(value), [value]);

  const apply = (next: DateFilterValue) => setFilters({ ...filters, fechaIngreso: next });

  const activePresetId = useMemo(() => {
    const exact = QUICK_PRESETS.find((p) => isEqualFilter(value, p.build()));
    return exact?.id ?? null;
  }, [value]);

  const boundStart = value.type === 'range' && value.from ? ddmmyyyy(value.from) : value.type === 'month' && value.month ? ddmmyyyy(monthBounds(value.month).from) : value.type === 'day' && value.day ? ddmmyyyy(value.day) : '—';
  const boundEnd = value.type === 'range' && value.to ? ddmmyyyy(value.to) : value.type === 'month' && value.month ? ddmmyyyy(monthBounds(value.month).to) : value.type === 'day' && value.day ? ddmmyyyy(value.day) : '—';

  return (
    <div className="sticky top-2 z-20">
      <div className="relative overflow-hidden rounded-2xl border border-brand-500/25 bg-surface-2/90 shadow-[0_18px_48px_-18px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-14 -right-10 size-40 rounded-full opacity-40" style={{ background: 'radial-gradient(circle at 40% 40%, rgba(227,6,19,0.18), transparent 66%)', filter: 'blur(32px)' }} />
        <div className="pointer-events-none absolute -bottom-16 -left-12 size-44 rounded-full opacity-35" style={{ background: 'radial-gradient(circle at 60% 40%, rgba(227,6,19,0.12), transparent 66%)', filter: 'blur(38px)' }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent" />

        <div className="relative z-10 px-4 pt-3.5 pb-4">
          <div className="flex items-center gap-2.5">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex size-9 shrink-0 items-center justify-center rounded-xl gradient-brand text-white shadow-glow-sm"
            >
              <Calendar className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-surface-2" style={{ boxShadow: '0 0 10px rgba(16,185,129,0.9)' }} />
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-[0.16em] text-ink uppercase">Periodo de análisis</p>
              <p className="text-[10px] font-medium text-ink-soft">Fecha de ingreso · principal</p>
            </div>
            {isActive && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full gradient-brand px-2 py-0.5 text-[10px] font-bold text-white shadow-glow-sm tabular-nums">
                {registros} registros
              </span>
            )}
            {isActive && (
              <button
                type="button"
                onClick={() => apply({ type: 'all' })}
                aria-label="Quitar filtro de fecha"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-line text-ink-muted transition-all duration-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <motion.div key={value.type + (value.day ?? value.month ?? value.year ?? value.from ?? value.to)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="mt-3">
            <p className="text-lg leading-tight font-bold tracking-tight text-ink">{summary.titulo}</p>
            <p className="mt-0.5 text-[11px] font-medium text-ink-soft">{summary.detalle}</p>
          </motion.div>

          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {[
              { k: 'Inicio', v: boundStart },
              { k: 'Fin', v: boundEnd },
              { k: 'Días', v: dias != null ? String(dias) : '—' },
              { k: 'Registros', v: formatNumber(registros) },
            ].map(({ k, v }) => (
              <div key={k} className="rounded-lg border border-line bg-surface-3/50 px-2 py-1.5 text-center transition-all duration-300 hover:border-brand-400/25">
                <p className="text-[8px] font-bold tracking-wider text-ink-muted uppercase">{k}</p>
                <p className="mt-0.5 truncate text-[11px] font-bold text-ink tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {QUICK_PRESETS.map((p) => {
              const activePreset = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => apply(p.build())}
                  className={cn(
                    'rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all duration-300',
                    activePreset
                      ? 'gradient-brand text-white shadow-glow-sm'
                      : 'border border-line bg-surface/50 text-ink-soft hover:-translate-y-0.5 hover:border-brand-400/40 hover:bg-brand-500/10 hover:text-brand-400 hover:shadow-glow-sm',
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setCustomOpen((o) => !o)}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-500/25 bg-brand-500/10 px-3 py-1.5 text-[10px] font-bold tracking-wide text-brand-400 uppercase transition-all duration-300 hover:border-brand-400/50 hover:bg-brand-500/15 hover:shadow-glow-sm"
          >
            <CalendarRange className={cn('size-3.5 transition-transform duration-300', customOpen && 'rotate-180')} />
            Periodo personalizado
          </button>

          <AnimatePresence initial={false}>
            {customOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <DateRangePicker
                  from={value.type === 'range' ? (value.from ?? null) : value.type === 'day' ? (value.day ?? null) : null}
                  to={value.type === 'range' ? (value.to ?? null) : null}
                  onChange={(from, to) => {
                    if (!from) apply({ type: 'all' });
                    else if (!to) apply({ type: 'day', day: from });
                    else apply({ type: 'range', from, to });
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
