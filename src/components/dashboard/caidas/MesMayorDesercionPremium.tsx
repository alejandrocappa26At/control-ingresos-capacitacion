'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange, Crown, Percent, Signal, TrendingUp } from 'lucide-react';
import { cn, formatNumber, formatPercentage } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import type { DesercionAnalisis } from '@/services/analytics/desercion';

const MAGENTA_GRADIENT = 'linear-gradient(135deg,#f472b6 0%,#db2777 55%,#be185d 100%)';
const MAGENTA_GLOW = 'rgba(219,39,119,0.5)';

export function MesMayorDesercionPremium({ data }: { data: DesercionAnalisis }) {
  const mes = data.mesMayor;
  const mesInfo = useMemo(() => {
    if (!mes) return null;
    return (
      data.tendencia.find((t) => t.mes === mes.mes) ?? null
    );
  }, [data, mes]);

  if (!mes) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
        className="relative h-full"
      >
        <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-3xl border border-magenta-500/25 bg-surface-2/60 p-6 backdrop-blur-xl">
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-magenta-300 uppercase">
            <Crown className="size-3" /> Mes con mayor deserción
          </p>
          <p className="mt-4 text-sm font-black text-ink-soft">Sin deserciones registradas en el periodo</p>
        </div>
      </motion.div>
    );
  }

  const maxVal = Math.max(1, ...data.tendencia.map((t) => t.deserciones));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
      className="group relative"
    >
      <div
        className="relative h-full overflow-hidden rounded-3xl border border-magenta-500/30 bg-surface-2/60 p-5 backdrop-blur-xl transition-all duration-300 ease-out group-hover:-translate-y-1"
        style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 22px 54px -26px ${MAGENTA_GLOW}` }}
      >
        <div className="pointer-events-none absolute -top-16 right-0 size-48 rounded-full blur-3xl" style={{ background: MAGENTA_GRADIENT, opacity: 0.16 }} />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-magenta-300 uppercase">
              <Crown className="size-3" /> Mes con mayor deserción
            </p>
            <div className="mt-3">
              <CountUp value={mes.cantidad} className="text-4xl font-black tracking-tight text-ink tabular-nums" />
              <span className="ml-2 text-lg font-black text-ink-soft">{mes.mes}</span>
            </div>
            <p className="mt-1.5 text-[11px] font-bold text-ink-soft">
              {mes.porcentaje.toFixed(1)}% de las deserciones del periodo
            </p>
          </div>
          <span
            className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ background: MAGENTA_GRADIENT, boxShadow: `0 0 20px ${MAGENTA_GLOW}` }}
          >
            <Crown className="size-5" />
          </span>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/10 bg-surface-3/60 px-3 py-2.5">
            <p className="text-[9px] font-bold tracking-wider text-ink-soft uppercase">Deserciones</p>
            <p className="mt-0.5 text-base font-black text-ink tabular-nums">{formatNumber(mes.cantidad)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-surface-3/60 px-3 py-2.5">
            <p className="text-[9px] font-bold tracking-wider text-ink-soft uppercase">Ingresos mes</p>
            <p className="mt-0.5 text-base font-black text-ink tabular-nums">
              {mesInfo ? formatNumber(mesInfo.ingresos) : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-surface-3/60 px-3 py-2.5">
            <p className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-magenta-300 uppercase">
              <TrendingUp className="size-3" /> Tasa mes
            </p>
            <p className="mt-0.5 text-base font-black text-magenta-300 tabular-nums">
              {mesInfo ? formatPercentage(mesInfo.tasa) : '—'}
            </p>
          </div>
        </div>

        <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/10 bg-surface-3/50 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-ink-soft uppercase">
            <Signal className="size-3" /> Deserciones por mes
          </p>
          <div className="flex h-16 items-end gap-1.5">
            {data.tendencia.map((t, i) => {
              const h = t.deserciones > 0 ? Math.max(6, (t.deserciones / maxVal) * 100) : 3;
              const isMax = mes && t.mes === mes.mes;
              return (
                <motion.div
                  key={`${t.mes}-${i}`}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.04 }}
                  className={cn(
                    'flex-1 rounded-t-md transition-colors',
                    isMax
                      ? 'shadow-[0_0_14px_rgba(219,39,119,0.6)]'
                      : 'bg-white/10',
                  )}
                  style={isMax ? { background: MAGENTA_GRADIENT } : undefined}
                />
              );
            })}
          </div>
        </div>

        <div className="relative mt-3 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-surface-3/50 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
              <Percent className="size-3.5" />
            </span>
            <span className="text-[10px] font-bold text-ink-soft">Participación del mes en el total</span>
          </div>
          <span className="text-sm font-black text-magenta-300 tabular-nums">{mes.porcentaje.toFixed(1)}%</span>
        </div>
      </div>
    </motion.div>
  );
}
