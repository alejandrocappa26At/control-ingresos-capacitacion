'use client';

import { motion } from 'framer-motion';
import { CalendarRange, Percent, TrendingDown, type LucideIcon } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import type { DesercionAnalisis } from '@/services/analytics/desercion';

type Tone = 'red' | 'amber' | 'crimson';

const TONES: Record<Tone, { icon: string; tile: string; bar: string; hover: string }> = {
  red: {
    icon: 'text-red-600',
    tile: 'bg-red-50 text-red-600',
    bar: 'from-red-500 via-rose-400 to-rose-500',
    hover: 'group-hover:border-red-500/30',
  },
  amber: {
    icon: 'text-amber-600',
    tile: 'bg-amber-50 text-amber-600',
    bar: 'from-amber-500 via-orange-400 to-orange-500',
    hover: 'group-hover:border-amber-500/30',
  },
  crimson: {
    icon: 'text-rose-700',
    tile: 'bg-rose-50 text-rose-700',
    bar: 'from-rose-700 via-rose-500 to-rose-400',
    hover: 'group-hover:border-rose-500/30',
  },
};

interface ContextoKpiProps {
  index: number;
  title: string;
  value: React.ReactNode;
  sub: string;
  icon: LucideIcon;
  tone: Tone;
}

function ContextoKpi({ index, title, value, sub, icon: Icon, tone }: ContextoKpiProps) {
  const s = TONES[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full"
    >
      <div
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-[0_1px_3px_rgba(17,24,39,0.06),0_8px_24px_-12px_rgba(17,24,39,0.12)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]',
          s.hover,
        )}
      >
        <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r opacity-80', s.bar)} />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">{title}</p>
            <div className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-ink">{value}</div>
            <p className="mt-1.5 text-[11px] font-medium leading-snug text-ink-muted">{sub}</p>
          </div>
          <div className={cn('relative flex size-11 shrink-0 items-center justify-center rounded-xl', s.tile)}>
            <Icon className={cn('size-5 transition-transform duration-300 group-hover:scale-110', s.icon)} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function DesercionKpis({ data }: { data: DesercionAnalisis }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <ContextoKpi
        index={0}
        title="Tasa de deserción"
        value={`${data.tasaDesercion.toFixed(1)}%`}
        sub="Deserciones ÷ Total de ingresos × 100"
        icon={Percent}
        tone="red"
      />
      <ContextoKpi
        index={1}
        title="Bajas durante capacitación"
        value={
          <span className="inline-flex flex-wrap items-baseline gap-x-2">
            <CountUp value={data.bajas} />
            <span className="text-sm font-bold text-amber-600 tabular-nums">{data.bajasPct.toFixed(1)}%</span>
          </span>
        }
        sub={`Abandonaron o fueron retirados en el proceso · ${data.bajasPct.toFixed(1)}% del total de ingresos`}
        icon={TrendingDown}
        tone="amber"
      />
      <ContextoKpi
        index={2}
        title="Mes con mayor deserción"
        value={
          data.mesMayor ? (
            <span className="text-xl tracking-wide text-rose-700 uppercase">{data.mesMayor.mes}</span>
          ) : (
            '—'
          )
        }
        sub={
          data.mesMayor
            ? `${formatNumber(data.mesMayor.cantidad)} deserciones · ${data.mesMayor.porcentaje.toFixed(1)}% del total`
            : 'Sin deserciones registradas'
        }
        icon={CalendarRange}
        tone="crimson"
      />
    </div>
  );
}