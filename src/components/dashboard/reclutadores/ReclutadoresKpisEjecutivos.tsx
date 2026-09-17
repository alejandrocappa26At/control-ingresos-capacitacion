'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, CheckCircle2, AlertTriangle, Gauge, type LucideIcon } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import { SEMAFORO_STYLES } from '@/services/analytics/reclutadores';
import type { ReclutadoresAnalisis, ResumenReclutador } from '@/services/analytics/reclutadores';

type Tone = 'brand' | 'emerald' | 'amber' | 'white' | 'gray';

const TONES: Record<Tone, { icon: string; tile: string; bar: string; line: string; orb: string; glow: string }> = {
  brand: {
    icon: 'text-rose-300',
    tile: 'from-[#e30613]/30 to-[#e30613]/5',
    bar: 'from-[#ff2735] via-[#e30613] to-[#7a030a]',
    line: 'via-[#ff2735]/50',
    orb: 'rgba(227,6,19,0.32)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(227,6,19,0.55)]',
  },
  emerald: {
    icon: 'text-emerald-400',
    tile: 'from-emerald-500/30 to-emerald-500/5',
    bar: 'from-emerald-400 via-emerald-500 to-teal-600',
    line: 'via-emerald-400/40',
    orb: 'rgba(34,197,94,0.24)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(34,197,94,0.45)]',
  },
  amber: {
    icon: 'text-amber-400',
    tile: 'from-amber-500/30 to-amber-500/5',
    bar: 'from-amber-400 via-orange-500 to-amber-700',
    line: 'via-amber-400/40',
    orb: 'rgba(245,158,11,0.24)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(245,158,11,0.45)]',
  },
  white: {
    icon: 'text-zinc-200',
    tile: 'from-white/25 to-white/5',
    bar: 'from-white via-zinc-400 to-zinc-600',
    line: 'via-white/40',
    orb: 'rgba(255,255,255,0.16)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(255,255,255,0.22)]',
  },
  gray: {
    icon: 'text-zinc-400',
    tile: 'from-zinc-500/30 to-zinc-500/5',
    bar: 'from-zinc-400 via-zinc-500 to-zinc-700',
    line: 'via-zinc-400/40',
    orb: 'rgba(161,161,170,0.22)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(113,113,122,0.45)]',
  },
};

interface EjecutivoKpiProps {
  index: number;
  title: string;
  value: React.ReactNode;
  sub: string;
  icon: LucideIcon;
  tone: Tone;
}

function EjecutivoKpi({ index, title, value, sub, icon: Icon, tone }: EjecutivoKpiProps) {
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
          'relative flex h-full min-h-[118px] flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-card backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/15',
          s.glow,
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100"
          style={{ backgroundImage: `radial-gradient(circle at 30% 18%, ${s.orb}, transparent 62%)` }}
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
            s.line,
          )}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-ink-soft uppercase">{title}</p>
            <div className="mt-2 text-lg font-bold tabular-nums tracking-tight text-ink line-clamp-2">
              {value}
            </div>
            <p className="mt-1.5 text-[11px] font-medium leading-snug text-ink-muted">{sub}</p>
          </div>
          <div
            className={cn(
              'relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
              s.tile,
            )}
          >
            <Icon className={cn('size-5 drop-shadow-[0_0_8px_currentColor] transition-transform duration-300 group-hover:scale-110', s.icon)} />
          </div>
        </div>

        <div
          className={cn(
            'absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r opacity-70 transition-opacity duration-300 group-hover:opacity-100',
            s.bar,
          )}
        />
      </div>
    </motion.div>
  );
}

function topPermanencia(list: ResumenReclutador[]): ResumenReclutador | undefined {
  return [...list]
    .filter((r) => r.procesosFinalizados > 0)
    .sort((a, b) => b.tasaPermanencia - a.tasaPermanencia)[0];
}

export function ReclutadoresKpisEjecutivos({ data }: { data: ReclutadoresAnalisis }) {
  const mejorReclutador = data.productividad[0];
  const mejorPermanencia = topPermanencia(data.productividad);
  const mayorDesercion = data.desercion[0];
  const procesosFinalizados = data.totalPasanOperaciones + data.totalBajas + data.totalDeserciones;
  const promedioPermanencia =
    procesosFinalizados > 0 ? (data.totalPasanOperaciones / procesosFinalizados) * 100 : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <EjecutivoKpi
        index={0}
        title="👥 Reclutadores activos"
        value={<CountUp value={data.totalReclutadores} />}
        sub="Con ingresos en el periodo"
        icon={Users}
        tone="brand"
      />
      <EjecutivoKpi
        index={1}
        title="🏆 Mejor reclutador"
        value={
          mejorReclutador ? (
            <span className="block truncate" title={mejorReclutador.responsable}>
              {mejorReclutador.responsable}
            </span>
          ) : (
            '—'
          )
        }
        sub={mejorReclutador ? `${formatNumber(mejorReclutador.ingresos)} ingresos` : 'Sin ingresos'}
        icon={Trophy}
        tone="white"
      />
      <EjecutivoKpi
        index={2}
        title="✅ Mejor permanencia"
        value={
          mejorPermanencia ? (
            <span className="block truncate" title={mejorPermanencia.responsable}>
              {mejorPermanencia.responsable}
            </span>
          ) : (
            '—'
          )
        }
        sub={mejorPermanencia ? `${mejorPermanencia.tasaPermanencia.toFixed(1)}% de permanencia` : 'Sin procesos finalizados'}
        icon={CheckCircle2}
        tone="emerald"
      />
      <EjecutivoKpi
        index={3}
        title="⚠ Mayor deserción"
        value={
          mayorDesercion ? (
            <span className="block truncate" title={`${SEMAFORO_STYLES[mayorDesercion.nivel].label} · ${mayorDesercion.responsable}`}>
              {SEMAFORO_STYLES[mayorDesercion.nivel].emoji} {mayorDesercion.responsable}
            </span>
          ) : (
            '—'
          )
        }
        sub={mayorDesercion ? `${mayorDesercion.tasaDesercion.toFixed(1)}% de deserción` : 'Sin deserciones'}
        icon={AlertTriangle}
        tone="amber"
      />
      <EjecutivoKpi
        index={4}
        title="📊 Promedio permanencia"
        value={<CountUp value={promedioPermanencia} format="percent" />}
        sub="Aprobados ÷ procesos finalizados"
        icon={Gauge}
        tone="gray"
      />
    </div>
  );
}