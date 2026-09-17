'use client';

import { motion } from 'framer-motion';
import { CalendarRange, Percent, Users, type LucideIcon } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import type { DesercionAnalisis } from '@/services/analytics/desercion';

type Tone = 'blue' | 'red' | 'gray' | 'crimson';

const TONES: Record<Tone, { icon: string; tile: string; bar: string; line: string; orb: string; glow: string }> = {
  blue: {
    icon: 'text-sky-400',
    tile: 'from-sky-500/30 to-sky-500/5',
    bar: 'from-sky-500 via-cyan-400 to-blue-600',
    line: 'via-sky-400/40',
    orb: 'rgba(56,189,248,0.28)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(56,189,248,0.45)]',
  },
  red: {
    icon: 'text-rose-400',
    tile: 'from-rose-500/30 to-rose-500/5',
    bar: 'from-rose-500 via-pink-400 to-fuchsia-500',
    line: 'via-rose-400/40',
    orb: 'rgba(244,63,94,0.28)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(239,68,68,0.45)]',
  },
  gray: {
    icon: 'text-zinc-400',
    tile: 'from-zinc-500/30 to-zinc-500/5',
    bar: 'from-zinc-400 via-zinc-500 to-zinc-700',
    line: 'via-zinc-400/40',
    orb: 'rgba(161,161,170,0.22)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(113,113,122,0.45)]',
  },
  crimson: {
    icon: 'text-[#ff8b8f]',
    tile: 'from-[#7a030a]/40 to-[#7a030a]/5',
    bar: 'from-[#e30613] via-[#ff2735] to-[#7a030a]',
    line: 'via-[#ff2735]/40',
    orb: 'rgba(227,6,19,0.32)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(227,6,19,0.55)]',
  },
};

interface DesercionKpiProps {
  index: number;
  title: string;
  value: React.ReactNode;
  sub: string;
  icon: LucideIcon;
  tone: Tone;
}

function DesercionKpi({ index, title, value, sub, icon: Icon, tone }: DesercionKpiProps) {
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
          'relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-white/15',
          s.glow,
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100"
          style={{ backgroundImage: `radial-gradient(circle at 30% 18%, ${s.orb}, transparent 62%)` }}
        />
        <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent', s.line)} />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-ink-soft uppercase">{title}</p>
            <div className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-ink">{value}</div>
            <p className="mt-1.5 text-[11px] font-medium leading-snug text-ink-muted">{sub}</p>
          </div>
          <div className={cn('relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]', s.tile)}>
            <Icon className={cn('size-5 drop-shadow-[0_0_8px_currentColor] transition-transform duration-300 group-hover:scale-110', s.icon)} />
          </div>
        </div>

        <div className={cn('absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r opacity-70 transition-opacity duration-300 group-hover:opacity-100', s.bar)} />
      </div>
    </motion.div>
  );
}

export function DesercionKpis({ data }: { data: DesercionAnalisis }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DesercionKpi
        index={0}
        title="Total de ingresos"
        value={<CountUp value={data.totalIngresos} />}
        sub="Total de registros cargados"
        icon={Users}
        tone="blue"
      />
      <DesercionKpi
        index={1}
        title="Total de deserciones"
        value={<CountUp value={data.totalDeserciones} />}
        sub="Nunca asistieron a capacitación"
        icon={CalendarRange}
        tone="gray"
      />
      <DesercionKpi
        index={2}
        title="Tasa de deserción"
        value={`${data.tasaDesercion.toFixed(1)}%`}
        sub="Deserciones ÷ Total de ingresos × 100"
        icon={Percent}
        tone="red"
      />
      <DesercionKpi
        index={3}
        title="Mes con mayor deserción"
        value={
          data.mesMayor ? (
            <span className="text-xl tracking-wide text-rose-200 uppercase">{data.mesMayor.mes}</span>
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