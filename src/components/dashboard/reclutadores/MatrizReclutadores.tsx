'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Users } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RANGOS_SEMAFORO, SEMAFORO_STYLES, nivelSemaforo } from '@/services/analytics/reclutadores';
import type { ResumenReclutador } from '@/services/analytics/reclutadores';
import type { Promotor } from '@/types';
import { ReclutadorDetailModal } from './ReclutadorDetailModal';

function pillStyle(color: string) {
  return {
    borderColor: `${color}55`,
    background: `${color}1A`,
    color,
  };
}

const GRID_COLS =
  'grid-cols-[minmax(0,1fr)_6.75rem_6.25rem_6.75rem_5.75rem_5.75rem_5.75rem_6.25rem_1.25rem]';

const HEAD_ID = 'flex items-end justify-center pb-2';
const HEAD_LEAD = 'flex items-end justify-center border-l border-line pb-2 pl-3 text-center';
const HEAD_CELL = 'flex items-end justify-center border-l border-line pb-2 pl-2 text-center';

const BODY_LEAD = 'flex items-center justify-center border-l border-line py-2 pl-3 text-center';
const BODY_CELL = 'flex items-center justify-center border-l border-line py-2 pl-2 text-center';

function HeadCell({ lines, lead = false }: { lines: string[]; lead?: boolean }) {
  return (
    <span className={lead ? HEAD_LEAD : HEAD_CELL}>
      <span>
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </span>
    </span>
  );
}

interface MatrizReclutadoresProps {
  data: ResumenReclutador[];
  records: Promotor[];
  onSelectPromotor?: (p: Promotor) => void;
}

export function MatrizReclutadores({ data, records, onSelectPromotor }: MatrizReclutadoresProps) {
  const [seleccion, setSeleccion] = useState<ResumenReclutador | null>(null);
  const rows = [...data].slice(0, 12);
  const max = Math.max(...rows.map((r) => r.ingresos), 1);
  const criticos = data.filter((r) => r.nivel === 'critico').length;

  if (rows.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
              <Users className="size-4" />
            </span>
            <div>
              <CardTitle className="text-sm tracking-tight">Matriz de reclutadores</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">
                Ordenado por ingresos · {criticos > 0 ? `${criticos} en nivel crítico de deserción` : 'sin niveles críticos'}
                {' · clic para ver el detalle'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 text-ink-soft">
            <Users className="size-5 text-ink-muted" />
            <p className="text-sm font-medium">No hay reclutadores con ingresos registrados.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
            <Users className="size-4" />
          </span>
          <div>
            <CardTitle className="text-sm tracking-tight">Matriz de reclutadores</CardTitle>
            <p className="mt-0.5 text-xs text-ink-soft">
              Ordenado por ingresos · {criticos > 0 ? `${criticos} en nivel crítico de deserción` : 'sin niveles críticos'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="overflow-x-auto pb-1">
          <div className={cn('grid min-w-[1040px] gap-4 border-b border-line px-2 text-[10px] leading-tight font-bold tracking-wider text-ink-muted uppercase', GRID_COLS)}>
            <span className={HEAD_ID}>Reclutador</span>
            <HeadCell lead lines={['Total', 'ingresos a', 'capacitación']} />
            <HeadCell lines={['Total', 'deserciones']} />
            <HeadCell lines={['Total bajas', 'en', 'capacitación']} />
            <HeadCell lines={['Tasa', 'deserción']} />
            <HeadCell lines={['Tasa baja']} />
            <HeadCell lines={['Tasa total']} />
            <HeadCell lines={['Permanencia']} />
            <span className="sr-only">Detalle</span>
          </div>

          <div className="flex min-w-[1040px] flex-col gap-2">
            {rows.map((r, i) => {
              const pct = max > 0 ? (r.ingresos / max) * 100 : 0;
              const s = SEMAFORO_STYLES[r.nivel];
              const sBaja = SEMAFORO_STYLES[nivelSemaforo(r.tasaBaja)];
              const sTotal = SEMAFORO_STYLES[nivelSemaforo(r.tasaTotal)];
              const esRadar = r.nivel === 'critico';
              return (
                <motion.div
                  key={r.responsable}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setSeleccion(r)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSeleccion(r);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver detalle de ${r.responsable}`}
                  className={cn(
                    'group/row grid cursor-pointer gap-4 rounded-lg px-2 transition-all duration-200 hover:shadow-[0_8px_24px_-16px_rgba(225,6,19,0.8)] focus-visible:outline-none',
                    GRID_COLS,
                    esRadar ? 'bg-rose-500/[0.06] hover:bg-rose-500/10' : 'hover:bg-surface-3/50',
                  )}
                >
                  <div className="min-w-0 py-2">
                    <div className="flex items-baseline gap-2">
                      <span className="shrink-0 text-[11px] font-black tabular-nums text-ink-soft">
                        #{i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="min-w-0 truncate text-sm font-bold text-ink">{r.responsable}</p>
                          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink-soft">
                            {r.pctDelTotal.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(pct, 3)}%` }}
                            transition={{ delay: 0.2 + i * 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={BODY_LEAD}>
                    <span className="font-black tabular-nums text-ink">{formatNumber(r.ingresos)}</span>
                  </div>

                  <div className={BODY_CELL}>
                    <span className="font-bold tabular-nums text-ink-muted">
                      {formatNumber(r.deserciones)}
                    </span>
                  </div>

                  <div className={BODY_CELL}>
                    <span className="font-bold tabular-nums text-orange-400">
                      {formatNumber(r.caidasCapacitacion)}
                    </span>
                  </div>

                  <div className={BODY_CELL}>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap tabular-nums"
                      style={pillStyle(s.color)}
                    >
                      {s.emoji} {r.tasaDesercion.toFixed(1)}%
                    </span>
                  </div>

                  <div className={BODY_CELL}>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap tabular-nums"
                      style={pillStyle(sBaja.color)}
                    >
                      {sBaja.emoji} {r.tasaBaja.toFixed(1)}%
                    </span>
                  </div>

                  <div className={BODY_CELL}>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap tabular-nums"
                      style={pillStyle(sTotal.color)}
                    >
                      {sTotal.emoji} {r.tasaTotal.toFixed(1)}%
                    </span>
                  </div>

                  <div className={BODY_CELL}>
                    <span className="font-bold tabular-nums text-emerald-400">
                      {r.ingresos > 0 ? `${r.tasaPermanencia.toFixed(1)}%` : '—'}
                    </span>
                  </div>

                  <span className="flex items-center justify-end py-2">
                    <ChevronRight className="size-4 text-ink-soft transition-all duration-200 group-hover/row:translate-x-0.5 group-hover/row:text-brand-400" />
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RANGOS_SEMAFORO.map((r) => (
            <div key={r.nivel} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-3/50 px-2.5 py-1.5">
              <span className="text-xs leading-none">{r.emoji}</span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold text-ink tabular-nums">
                  {r.rango}
                </p>
                <p className="text-[9px] font-semibold tracking-wide text-ink-soft uppercase">{r.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

      <ReclutadorDetailModal
        reclutador={seleccion?.responsable ?? null}
        resumen={seleccion}
        records={records}
        onClose={() => setSeleccion(null)}
        onSelectPromotor={onSelectPromotor}
      />
    </>
  );
}