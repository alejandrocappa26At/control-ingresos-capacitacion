'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarRange,
  Check,
  ChevronDown,
  Layers,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { DateRangePicker } from '@/components/filters/DateRangePicker';
import { cn } from '@/lib/utils';
import { ddmmyyyy } from '@/lib/dates';
import type { Promotor } from '@/types';

export type PeriodoCaidaMode = 'mes' | 'anio' | 'personalizado';

export interface PeriodoCaidaState {
  mode: PeriodoCaidaMode;
  /** Meses seleccionados como número 1-12 (acumulable). */
  meses: number[];
  /** Años seleccionados como string. */
  anios: string[];
  /** ISO yyyy-MM-dd */
  from: string | null;
  to: string | null;
}

export const PERIODO_CAIDA_INICIAL: PeriodoCaidaState = {
  mode: 'mes',
  meses: [],
  anios: [],
  from: null,
  to: null,
};

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

const MODES: Array<{ id: PeriodoCaidaMode; label: string; icon: typeof Layers }> = [
  { id: 'mes', label: 'Por mes', icon: Layers },
  { id: 'anio', label: 'Por año', icon: CalendarRange },
  { id: 'personalizado', label: 'Personalizado', icon: SlidersHorizontal },
];

const ESTIMATED_HEIGHT = 420;

function fechaIngreso(r: Promotor): string {
  return r.fechasISO.fechaIngreso || r.fechaIngreso || '';
}

export function aniosDisponibles(records: Promotor[]): string[] {
  const set = new Set<string>();
  for (const r of records) {
    const y = fechaIngreso(r).slice(0, 4);
    if (/^\d{4}$/.test(y)) set.add(y);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Aplica el período elegido sobre los registros, usando la fecha de ingreso. */
export function filtrarPorPeriodo(records: Promotor[], p: PeriodoCaidaState): Promotor[] {
  if (p.mode === 'mes') {
    if (p.meses.length === 0) return records;
    const set = new Set(p.meses);
    return records.filter((r) => {
      const m = fechaIngreso(r).slice(5, 7);
      return /^\d{2}$/.test(m) && set.has(Number(m));
    });
  }
  if (p.mode === 'anio') {
    if (p.anios.length === 0) return records;
    const set = new Set(p.anios);
    return records.filter((r) => set.has(fechaIngreso(r).slice(0, 4)));
  }
  if (!p.from && !p.to) return records;
  return records.filter((r) => {
    const iso = fechaIngreso(r);
    if (!iso) return false;
    if (p.from && iso < p.from) return false;
    if (p.to && iso > p.to) return false;
    return true;
  });
}

function descripcionPeriodo(p: PeriodoCaidaState): string {
  if (p.mode === 'mes') {
    if (p.meses.length === 0) return 'Todos los meses';
    if (p.meses.length === 12) return 'Todo el año';
    return `${p.meses.length} ${p.meses.length === 1 ? 'mes' : 'meses'}`;
  }
  if (p.mode === 'anio') {
    if (p.anios.length === 0) return 'Todos los años';
    return p.anios.join(' · ');
  }
  if (p.from && p.to) return `${ddmmyyyy(p.from)} – ${ddmmyyyy(p.to)}`;
  if (p.from) return `Desde ${ddmmyyyy(p.from)}`;
  return 'Todo el período';
}

export function FiltroPeriodoCaida({
  value,
  onChange,
  records,
}: {
  value: PeriodoCaidaState;
  onChange: (next: PeriodoCaidaState) => void;
  records: Promotor[];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const anios = useMemo(() => aniosDisponibles(records), [records]);

  const active =
    (value.mode === 'mes' && value.meses.length > 0) ||
    (value.mode === 'anio' && value.anios.length > 0) ||
    (value.mode === 'personalizado' && (value.from != null || value.to != null));

  const computePos = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < ESTIMATED_HEIGHT && spaceAbove > spaceBelow;
    const width = Math.min(Math.max(rect.width, 300), window.innerWidth - 16);
    setPos({
      top: openUp ? Math.max(8, rect.top - ESTIMATED_HEIGHT) : rect.bottom + 8,
      left: Math.min(Math.max(8, rect.left), window.innerWidth - width - 8),
      width,
    });
  };

  useEffect(() => {
    if (!open) return;
    computePos();
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current && !panelRef.current.contains(t)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', computePos);
    window.addEventListener('scroll', computePos, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', computePos);
      window.removeEventListener('scroll', computePos, true);
    };
  }, [open]);

  const toggleMes = (m: number) =>
    onChange({
      ...value,
      meses: value.meses.includes(m) ? value.meses.filter((x) => x !== m) : [...value.meses, m].sort((a, b) => a - b),
    });

  const toggleAnio = (y: string) =>
    onChange({
      ...value,
      anios: value.anios.includes(y) ? value.anios.filter((x) => x !== y) : [...value.anios, y].sort(),
    });

  const panel =
    open && pos ? (
      <motion.div
        ref={panelRef}
        style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -6 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong overflow-hidden rounded-2xl border border-line shadow-[0_24px_70px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04),0_0_46px_-10px_rgba(227,6,19,0.28)]"
      >
        <div className="h-1 w-full bg-gradient-to-r from-brand-500/80 via-rose-500/60 to-transparent" />

        <div className="flex items-center justify-between gap-2 border-b border-line/70 px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] font-black tracking-[0.14em] text-ink uppercase">Período de la gráfica</p>
            <p className="truncate text-[10px] text-ink-soft">{descripcionPeriodo(value)}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(PERIODO_CAIDA_INICIAL)}
            className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink"
          >
            LIMPIAR
          </button>
        </div>

        <div className="flex gap-1.5 px-3.5 pt-3">
          {MODES.map(({ id, label, icon: Icon }) => {
            const isActiveMode = value.mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ ...value, mode: id })}
                className={cn(
                  'relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-bold whitespace-nowrap transition-colors duration-300',
                  isActiveMode ? 'text-ink' : 'text-ink-soft hover:text-ink',
                )}
              >
                {isActiveMode && (
                  <motion.span
                    layoutId="periodo-caida-mode"
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 rounded-xl border border-brand-400/40 bg-brand-500/15"
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <Icon className="size-3.5" />
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="max-h-[340px] overflow-y-auto px-3.5 py-3">
          <AnimatePresence mode="wait" initial={false}>
            {value.mode === 'mes' && (
              <motion.div
                key="mes"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-ink-soft">
                    Selecciona uno o varios meses (se acumulan entre años)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        meses: value.meses.length === 12 ? [] : MESES.map((_, i) => i + 1),
                      })
                    }
                    className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold text-brand-400 transition-colors hover:bg-brand-500/10"
                  >
                    {value.meses.length === 12 ? 'NINGUNO' : 'TODOS'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MESES.map((m, i) => {
                    const n = i + 1;
                    const on = value.meses.includes(n);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMes(n)}
                        className={cn(
                          'relative flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-bold uppercase transition-all duration-200',
                          on
                            ? 'border-brand-400/50 bg-brand-500/20 text-ink shadow-[0_0_16px_-6px_rgba(227,6,19,0.7)]'
                            : 'border-line bg-surface/40 text-ink-soft hover:border-brand-400/30 hover:text-ink',
                        )}
                      >
                        {on && <Check className="size-3 shrink-0 text-brand-400" />}
                        <span className="truncate">{m.slice(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {value.mode === 'anio' && (
              <motion.div
                key="anio"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {anios.length === 0 ? (
                  <p className="py-8 text-center text-[11px] text-ink-soft">
                    No hay años con fecha de ingreso registrada.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {anios.map((y) => {
                      const on = value.anios.includes(y);
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => toggleAnio(y)}
                          className={cn(
                            'relative flex items-center justify-center gap-1 rounded-lg border px-2 py-2.5 text-[11px] font-bold tabular-nums transition-all duration-200',
                            on
                              ? 'border-brand-400/50 bg-brand-500/20 text-ink shadow-[0_0_16px_-6px_rgba(227,6,19,0.7)]'
                              : 'border-line bg-surface/40 text-ink-soft hover:border-brand-400/30 hover:text-ink',
                          )}
                        >
                          {on && <Check className="size-3 shrink-0 text-brand-400" />}
                          {y}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {value.mode === 'personalizado' && (
              <motion.div
                key="personalizado"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <DateRangePicker
                  from={value.from}
                  to={value.to}
                  onChange={(from, to) => onChange({ ...value, from, to })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Chips value={value} onChange={onChange} />
      </motion.div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-[11px] font-bold transition-all duration-300',
          active || open
            ? 'border-brand-400/45 bg-brand-500/12 text-ink shadow-[0_0_22px_-8px_rgba(227,6,19,0.6)]'
            : 'border-line bg-surface-2/70 text-ink-soft hover:border-brand-400/30 hover:text-ink',
        )}
      >
        <SlidersHorizontal className={cn('size-4 shrink-0', active ? 'text-brand-400' : 'text-ink-soft')} />
        <span className="hidden sm:inline">{descripcionPeriodo(value)}</span>
        {active && (
          <span className="rounded-md bg-brand-500/25 px-1.5 py-0.5 text-[10px] tabular-nums text-brand-200">
            FILTRO
          </span>
        )}
        <ChevronDown className={cn('size-3.5 shrink-0 transition-transform duration-300', open && 'rotate-180')} />
      </button>

      {typeof document !== 'undefined' && createPortal(<AnimatePresence>{panel}</AnimatePresence>, document.body)}
    </>
  );
}

function Chips({ value, onChange }: { value: PeriodoCaidaState; onChange: (n: PeriodoCaidaState) => void }) {
  const items: Array<{ label: string; remove: () => void }> = [];

  if (value.mode === 'mes') {
    for (const m of value.meses) {
      items.push({
        label: MESES[m - 1].slice(0, 3),
        remove: () => onChange({ ...value, meses: value.meses.filter((x) => x !== m) }),
      });
    }
  } else if (value.mode === 'anio') {
    for (const y of value.anios) {
      items.push({
        label: y,
        remove: () => onChange({ ...value, anios: value.anios.filter((x) => x !== y) }),
      });
    }
  } else if (value.from || value.to) {
    items.push({
      label: value.from && value.to ? `${ddmmyyyy(value.from)} – ${ddmmyyyy(value.to)}` : value.from ? `Desde ${ddmmyyyy(value.from)}` : `Hasta ${ddmmyyyy(value.to!)}`,
      remove: () => onChange({ ...value, from: null, to: null }),
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 border-t border-line/70 px-3.5 py-2.5">
      <AnimatePresence initial={false}>
        {items.map((it) => (
          <motion.span
            key={it.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.16 }}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-brand-300 uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            {it.label}
            <button
              type="button"
              onClick={it.remove}
              aria-label={`Quitar ${it.label}`}
              className="flex size-3.5 shrink-0 items-center justify-center rounded-full text-brand-300/70 transition-colors hover:bg-brand-500/25 hover:text-brand-200"
            >
              <X className="size-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
