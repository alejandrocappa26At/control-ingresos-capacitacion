'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RANGOS_SEMAFORO, SEMAFORO_STYLES } from '@/services/analytics/reclutadores';
import type { ResumenReclutador } from '@/services/analytics/reclutadores';

function pillStyle(color: string) {
  return {
    borderColor: `${color}55`,
    background: `${color}1A`,
    color,
  };
}

export function MatrizReclutadores({ data }: { data: ResumenReclutador[] }) {
  const rows = [...data].slice(0, 12);
  const max = Math.max(...rows.map((r) => r.ingresos), 1);
  const criticos = data.filter((r) => r.nivel === 'critico' && r.deserciones > 0).length;

  if (rows.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Users className="size-4" />
            </span>
            <div>
              <CardTitle className="text-sm tracking-tight">Matriz de reclutadores</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">Ingresos · deserciones · tasa por responsable A&S</p>
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
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
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
        <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_4rem_3.5rem] items-center gap-3 border-b border-line pb-2 text-[10px] font-bold tracking-wider text-ink-muted uppercase">
          <span>Reclutador</span>
          <span className="text-right">Ingresos</span>
          <span className="text-right">Deserciones</span>
          <span className="text-right">Tasa</span>
          <span className="text-right">Perm.</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {rows.map((r, i) => {
            const pct = max > 0 ? (r.ingresos / max) * 100 : 0;
            const s = SEMAFORO_STYLES[r.nivel];
            const esRadar = r.nivel === 'critico' && r.deserciones > 0;
            return (
              <motion.div
                key={r.responsable}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_4rem_3.5rem] items-center gap-3 rounded-lg px-2 py-2 transition-colors',
                  esRadar ? 'bg-rose-500/[0.06]' : 'hover:bg-surface-3/50',
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="shrink-0 text-[11px] font-black tabular-nums text-ink-soft">
                      #{i + 1}
                    </span>
                    <p className="truncate text-sm font-bold text-ink">{r.responsable}</p>
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink-soft">
                      {r.pctDelTotal.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 3)}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                    />
                  </div>
                </div>

                <span className="text-right font-black tabular-nums text-ink">
                  {formatNumber(r.ingresos)}
                </span>

                <span className="text-right font-bold tabular-nums text-ink-muted">
                  {formatNumber(r.deserciones)}
                </span>

                <div className="text-right">
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap tabular-nums"
                    style={pillStyle(s.color)}
                  >
                    {s.emoji} {r.tasaDesercion.toFixed(1)}%
                  </span>
                </div>

                <span className="text-right font-bold tabular-nums text-emerald-700">
                  {r.procesosFinalizados > 0 ? `${r.tasaPermanencia.toFixed(1)}%` : '—'}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RANGOS_SEMAFORO.map((r) => (
            <div key={r.nivel} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-3/50 px-2.5 py-1.5">
              <span className="text-xs leading-none">{r.emoji}</span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold text-ink tabular-nums">
                  {r.max === Infinity ? '9%+' : `0-${r.max}%`}
                </p>
                <p className="text-[9px] font-semibold tracking-wide text-ink-soft uppercase">{r.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}