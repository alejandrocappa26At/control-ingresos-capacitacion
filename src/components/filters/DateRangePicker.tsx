'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import {
  format,
  formatISO,
  getDay,
  isSameDay,
  lastDayOfMonth,
  parse,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { currentMonth, shiftMonth } from '@/lib/dates';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function buildMonthCells(month: string): Array<{ iso: string | null; day: number }> {
  const first = parse(month, 'yyyy-MM', new Date());
  const offset = (getDay(first) + 6) % 7;
  const last = lastDayOfMonth(first);
  const cells: Array<{ iso: string | null; day: number }> = [];
  for (let i = 0; i < offset; i++) cells.push({ iso: null, day: 0 });
  const year = first.getFullYear();
  const monthIndex = first.getMonth();
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push({
      iso: formatISO(new Date(year, monthIndex, d), { representation: 'date' }),
      day: d,
    });
  }
  return cells;
}

export interface DateRangePickerProps {
  /** ISO yyyy-MM-dd */
  from: string | null;
  /** ISO yyyy-MM-dd */
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
  className?: string;
  /** Mes inicial visible (yyyy-MM). Por defecto, el mes de `from` o el actual. */
  initialMonth?: string;
}

/**
 * Calendario dual para seleccionar un rango de fechas con dos clics.
 * Reutilizado por el filtro global de período y por el filtro independiente
 * de la gráfica de caídas.
 */
export function DateRangePicker({ from, to, onChange, className, initialMonth }: DateRangePickerProps) {
  const [viewMonth, setViewMonth] = useState(() => initialMonth ?? from?.slice(0, 7) ?? currentMonth());
  const [rangeStart, setRangeStart] = useState<string | null>(from);
  const [hover, setHover] = useState<string | null>(null);
  const [prev, setPrev] = useState<{ from: string | null; to: string | null }>({ from, to });

  // Sincroniza con el rango externo. Un rango completo (con `to`) no deja
  // inicio pendiente: el siguiente clic arranca un rango nuevo.
  if (from !== prev.from || to !== prev.to) {
    setPrev({ from, to });
    setRangeStart(to == null ? from : null);
  }

  const selected = (iso: string): 'start' | 'end' | 'mid' | null => {
    if (from && to && iso >= from && iso <= to) {
      return iso === from ? 'start' : iso === to ? 'end' : 'mid';
    }
    if (from && to) return null;
    if (from === iso) return 'start';
    return null;
  };

  const preview = (iso: string): boolean => {
    if (!rangeStart || !hover) return false;
    const lo = rangeStart < hover ? rangeStart : hover;
    const hi = rangeStart < hover ? hover : rangeStart;
    return iso > lo && iso < hi;
  };

  const onDayClick = (iso: string) => {
    setHover(null);
    if (!rangeStart) {
      setRangeStart(iso);
      onChange(iso, null);
      return;
    }
    const start = rangeStart <= iso ? rangeStart : iso;
    const end = rangeStart <= iso ? iso : rangeStart;
    setRangeStart(null);
    onChange(start, end);
  };

  const renderMonth = (month: string) => {
    const title = capitalize(format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: es }));

    return (
      <div className="min-w-0">
        <div className="mb-2 text-center text-xs font-bold tracking-wider text-ink uppercase">{title}</div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {WEEKDAYS.map((w) => (
            <div key={w} className="pb-1 text-center text-[9px] font-bold tracking-wide text-ink-muted uppercase">
              {w}
            </div>
          ))}
          {buildMonthCells(month).map((cell, idx) => {
            if (!cell.iso) return <div key={`b${idx}`} />;
            const iso = cell.iso;
            const state = selected(iso);
            const today = isSameDay(parse(iso, 'yyyy-MM-dd', new Date()), new Date());
            return (
              <div key={iso} className="flex justify-center p-0.5">
                <button
                  type="button"
                  onClick={() => onDayClick(iso)}
                  onMouseEnter={() => setHover(iso)}
                  onMouseLeave={() => setHover(null)}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums transition-all duration-200',
                    state === 'start' || state === 'end'
                      ? 'gradient-brand text-white shadow-glow-sm'
                      : state === 'mid' || preview(iso)
                        ? 'bg-brand-500/20 text-brand-100'
                        : 'text-ink-soft hover:bg-white/[0.08] hover:text-ink',
                    today && !state && 'ring-1 ring-brand-400/60',
                  )}
                >
                  {cell.day}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('rounded-xl border border-line bg-black/20 p-3', className)}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-ink-soft">
          {rangeStart && !to ? 'Elige el día de fin' : 'Rango personalizado'}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMonth(shiftMonth(viewMonth, -1))}
            aria-label="Mes anterior"
            className="flex size-7 items-center justify-center rounded-lg border border-line bg-surface/50 text-ink-soft transition-all duration-300 hover:border-brand-400/40 hover:bg-brand-500/10 hover:text-brand-400"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMonth(shiftMonth(viewMonth, 1))}
            aria-label="Mes siguiente"
            className="flex size-7 items-center justify-center rounded-lg border border-line bg-surface/50 text-ink-soft transition-all duration-300 hover:border-brand-400/40 hover:bg-brand-500/10 hover:text-brand-400"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {renderMonth(viewMonth)}
        {renderMonth(shiftMonth(viewMonth, 1))}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line/70 pt-2.5">
        <p className="text-[10px] leading-tight text-ink-soft">
          <span className="font-semibold text-brand-400">1.</span> Clic en el día de inicio ·{' '}
          <span className="font-semibold text-brand-400">2.</span> Clic en el día de fin
        </p>
        <button
          type="button"
          onClick={() => {
            setRangeStart(null);
            onChange(null, null);
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink"
        >
          <RotateCcw className="size-3" />
          LIMPIAR
        </button>
      </div>
    </div>
  );
}
