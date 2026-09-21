'use client';

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEMAFORO_STYLES } from '@/services/analytics/reclutadores';
import { ZONA_SEMAFORO_RANGOS } from '@/services/analytics/zonas';
import type { ZonaDesercion } from '@/services/analytics/zonas';

function pillStyle(color: string) {
  return {
    borderColor: `${color}55`,
    background: `${color}1A`,
    color,
  };
}

export function MatrizZonaComercial({
  data,
  zonaCritica,
}: {
  data: ZonaDesercion[];
  zonaCritica: ZonaDesercion | null;
}) {
  const rows = [...data].filter((z) => z.deserciones > 0).slice(0, 12);
  const max = Math.max(...rows.map((z) => z.deserciones), 1);
  const criticas = rows.filter((z) => z.nivel === 'critico').length;

  if (rows.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <MapPin className="size-4" />
            </span>
            <div>
              <CardTitle className="text-sm tracking-tight">Matriz de zonas comerciales</CardTitle>
              <p className="mt-0.5 text-xs text-ink-soft">Caídas · tasa · semáforo por zona comercial</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 text-ink-soft">
            <MapPin className="size-5 text-ink-muted" />
            <p className="text-sm font-medium">No hay deserciones por zona.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
            <MapPin className="size-4" />
          </span>
          <div>
            <CardTitle className="text-sm tracking-tight">Matriz de zonas comerciales</CardTitle>
            <p className="mt-0.5 text-xs text-ink-soft">
              Caídas · tasa · semáforo por zona · {criticas > 0 ? `${criticas} en nivel crítico` : 'sin niveles críticos'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {zonaCritica && zonaCritica.deserciones > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-rose-500/30 bg-rose-500/[0.08] px-3.5 py-2.5 text-[11px] font-medium text-ink">
            <span className="text-sm leading-none">🔴</span>
            <span className="font-black tracking-wider text-rose-400 uppercase">Zona más crítica</span>
            <span className="font-bold text-ink">{zonaCritica.zona}</span>
            <span className="tabular-nums text-rose-400">{formatNumber(zonaCritica.deserciones)} caídas</span>
            <span className="tabular-nums text-amber-400">{zonaCritica.tasaDesercion.toFixed(1)}% de tasa</span>
          </div>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_4.5rem] items-center gap-3 border-b border-line pb-2 text-[10px] font-bold tracking-wider text-ink-muted uppercase">
          <span>Zona comercial</span>
          <span className="text-right">Caídas</span>
          <span className="text-right">Tasa</span>
          <span className="text-right">Estado</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {rows.map((z, i) => {
            const pct = max > 0 ? (z.deserciones / max) * 100 : 0;
            const s = SEMAFORO_STYLES[z.nivel];
            const esCritica = zonaCritica?.zona === z.zona;
            return (
              <motion.div
                key={z.zona}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'grid grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_4.5rem] items-center gap-3 rounded-lg px-2 py-2 transition-colors',
                  esCritica ? 'bg-rose-500/[0.06]' : 'hover:bg-surface-3/50',
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="shrink-0 text-[11px] font-black tabular-nums text-ink-soft">
                      #{i + 1}
                    </span>
                    <p className="truncate text-sm font-bold text-ink">{z.zona}</p>
                    <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink-soft">
                      {z.pctDelTotal.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(pct, 3)}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400"
                    />
                  </div>
                </div>

                <span className="text-right font-black tabular-nums text-ink">
                  {formatNumber(z.deserciones)}
                </span>

                <span className="text-right font-bold tabular-nums text-ink-muted">
                  {z.tasaDesercion.toFixed(1)}%
                </span>

                <div className="text-right">
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap tabular-nums"
                    style={pillStyle(s.color)}
                  >
                    {s.emoji} {z.tasaDesercion.toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ZONA_SEMAFORO_RANGOS.map((r) => (
            <div key={r.nivel} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-3/50 px-2.5 py-1.5">
              <span className="text-xs leading-none">{r.emoji}</span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold text-ink tabular-nums">
                  {r.max === Infinity ? '9%+' : `${r.max === 3 ? '0' : r.max - 3}-${r.max}%`}
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