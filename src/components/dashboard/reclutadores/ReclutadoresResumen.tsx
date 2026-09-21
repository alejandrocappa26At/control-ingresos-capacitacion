'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Users, UserRoundPlus, CalendarRange, CheckCircle2, Trophy, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import type { ReclutadoresAnalisis, ResumenReclutador } from '@/services/analytics/reclutadores';

type Tone = 'brand' | 'slate' | 'red' | 'emerald' | 'amber';

const TONES: Record<Tone, { icon: string; tile: string; bar: string; hover: string }> = {
  brand: {
    icon: 'text-brand-400',
    tile: 'bg-brand-500/10 text-brand-300',
    bar: 'from-brand-500 via-brand-400 to-brand-500',
    hover: 'group-hover:border-brand-400/30',
  },
  slate: {
    icon: 'text-slate-400',
    tile: 'bg-slate-500/10 text-slate-300',
    bar: 'from-slate-400 via-slate-300 to-slate-500',
    hover: 'group-hover:border-slate-400/30',
  },
  red: {
    icon: 'text-red-400',
    tile: 'bg-red-500/10 text-red-300',
    bar: 'from-red-500 via-rose-400 to-rose-500',
    hover: 'group-hover:border-red-400/30',
  },
  emerald: {
    icon: 'text-emerald-400',
    tile: 'bg-emerald-500/10 text-emerald-300',
    bar: 'from-emerald-500 via-teal-400 to-teal-500',
    hover: 'group-hover:border-emerald-400/30',
  },
  amber: {
    icon: 'text-amber-400',
    tile: 'bg-amber-500/10 text-amber-300',
    bar: 'from-amber-500 via-orange-400 to-orange-500',
    hover: 'group-hover:border-amber-400/30',
  },
};

interface ResumenCardProps {
  index: number;
  title: string;
  value: React.ReactNode;
  sub: string;
  icon: LucideIcon;
  tone: Tone;
}

function ResumenCard({ index, title, value, sub, icon: Icon, tone }: ResumenCardProps) {
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
          'relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.25),0_8px_24px_-12px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]',
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

function mejorPermanencia(list: ResumenReclutador[]): ResumenReclutador | undefined {
  return [...list]
    .filter((r) => r.procesosFinalizados > 0)
    .sort((a, b) => b.tasaPermanencia - a.tasaPermanencia)[0];
}

export function ReclutadoresResumen({ data }: { data: ReclutadoresAnalisis }) {
  const mejor = mejorPermanencia(data.productividad);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <ResumenCard
        index={0}
        title="Total reclutadores"
        value={<CountUp value={data.totalReclutadores} />}
        sub="Únicos con ingresos en el periodo"
        icon={Users}
        tone="brand"
      />
      <ResumenCard
        index={1}
        title="Total ingresos"
        value={<CountUp value={data.totalIngresos} />}
        sub="Registros con responsable asignado"
        icon={UserRoundPlus}
        tone="slate"
      />
      <ResumenCard
        index={2}
        title="Total deserciones"
        value={<CountUp value={data.totalDeserciones} />}
        sub="Ingresos que nunca asistieron"
        icon={CalendarRange}
        tone="red"
      />
      <ResumenCard
        index={3}
        title="Pasan a operaciones"
        value={<CountUp value={data.totalPasanOperaciones} />}
        sub="Ingresos que completan el proceso"
        icon={CheckCircle2}
        tone="emerald"
      />
      <ResumenCard
        index={4}
        title="Mejor permanencia"
        value={mejor ? `${mejor.tasaPermanencia.toFixed(1)}%` : '—'}
        sub={mejor ? mejor.responsable : 'Sin procesos finalizados'}
        icon={Trophy}
        tone="amber"
      />
    </div>
  );
}