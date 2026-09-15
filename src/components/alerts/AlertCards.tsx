'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CalendarClock, Hourglass, TrendingUp, ShieldAlert, BellRing } from 'lucide-react';
import type { Alerta } from '@/types';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

const ALERT_META = {
  'baja-asistencia': { icon: AlertTriangle, tone: 'warning' as const },
  'proxima-finalizacion': { icon: CalendarClock, tone: 'info' as const },
  'pendiente-entrega': { icon: Hourglass, tone: 'warning' as const },
  'incremento-caidas': { icon: TrendingUp, tone: 'danger' as const },
  'riesgo-desaprobacion': { icon: ShieldAlert, tone: 'brand' as const },
} as const;

const LEVEL_STYLES: Record<Alerta['nivel'], { label: string; badge: string; bar: string; glow: string; value: number; dot: string; accent: string }> = {
  alta: {
    label: 'Crítico',
    badge: 'border-[#ff2735]/30 bg-[#ff2735]/12 text-[#ff8b8f]',
    bar: 'gradient-danger',
    glow: 'hover:shadow-glow-rose',
    value: 92,
    dot: 'bg-[#ff2735]',
    accent: 'gradient-danger',
  },
  media: {
    label: 'Atención',
    badge: 'border-amber-500/30 bg-amber-500/12 text-amber-400',
    bar: 'gradient-warning',
    glow: 'hover:shadow-glow-amber',
    value: 58,
    dot: 'bg-amber-400',
    accent: 'gradient-warning',
  },
  baja: {
    label: 'Correcto',
    badge: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-400',
    bar: 'gradient-success',
    glow: 'hover:shadow-glow-emerald',
    value: 30,
    dot: 'bg-emerald-400',
    accent: 'gradient-success',
  },
};

const TILE_STYLES: Record<string, string> = {
  warning: 'from-amber-500/20 to-amber-500/5 text-amber-400',
  info: 'from-white/10 to-white/[0.02] text-zinc-300',
  danger: 'from-rose-500/25 to-rose-500/5 text-rose-400',
  brand: 'from-brand-500/25 to-brand-500/5 text-brand-300',
};

export function AlertCards({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) {
    return (
      <EmptyState
        icon={BellRing}
        title="Sin alertas en este momento"
        description="No se detectaron alertas con los datos actuales y los filtros activos."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {alertas.map((alerta, i) => {
        const meta = ALERT_META[alerta.tipo];
        const Icon = meta.icon;
        const level = LEVEL_STYLES[alerta.nivel];
        return (
          <motion.div
            key={alerta.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card
              hoverable
              className={cn(
                'relative h-full overflow-hidden p-4 transition-all duration-300 ease-out',
                alerta.nivel === 'alta' && 'ring-1 ring-[#ff2735]/25',
                level.glow,
              )}
            >
              <div className={cn('pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-r-full gradient-danger', level.accent)} />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
                    TILE_STYLES[meta.tone],
                  )}
                >
                  <Icon className="size-5 drop-shadow-[0_0_8px_currentColor]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-ink">{alerta.titulo}</p>
                    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase', level.badge)}>
                      <span className={cn('size-1.5 rounded-full', level.dot, alerta.nivel === 'alta' && 'animate-pulse-glow')} />
                      {level.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">{alerta.mensaje}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="uppercase tracking-wide text-ink-soft">Impacto</span>
                  <span className="tabular-nums text-ink">
                    {formatNumber(alerta.cantidad)} registros
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${level.value}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={cn('h-full rounded-full', level.bar)}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}