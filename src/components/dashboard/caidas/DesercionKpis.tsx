'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarRange,
  Percent,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import type { DesercionAnalisis } from '@/services/analytics/desercion';

type Tone = 'red' | 'amber' | 'crimson';

interface ToneStyle {
  label: string;
  gradient: string;
  glow: string;
  edge: string;
}

const TONES: Record<Tone, ToneStyle> = {
  red: {
    label: 'text-red-400',
    gradient: 'linear-gradient(135deg,#ff4d4f 0%,#e30613 55%,#d90429 100%)',
    glow: 'rgba(227,6,19,0.5)',
    edge: 'rgba(255,77,79,0.28)',
  },
  amber: {
    label: 'text-amber-400',
    gradient: 'linear-gradient(135deg,#fde047 0%,#f59e0b 55%,#ea580c 100%)',
    glow: 'rgba(245,158,11,0.45)',
    edge: 'rgba(245,158,11,0.25)',
  },
  crimson: {
    label: 'text-rose-400',
    gradient: 'linear-gradient(135deg,#fb7185 0%,#f43f5e 55%,#be123c 100%)',
    glow: 'rgba(244,63,94,0.5)',
    edge: 'rgba(244,63,94,0.28)',
  },
};

interface CrystalKpiProps {
  index: number;
  title: string;
  value: ReactNode;
  sub: string;
  icon: LucideIcon;
  tone: Tone;
  footer: ReactNode;
}

function CrystalKpi({ index, title, value, sub, icon: Icon, tone, footer }: CrystalKpiProps) {
  const t = TONES[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full"
    >
      <div
        className="relative h-full rounded-3xl p-px transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.01]"
        style={{
          background: `linear-gradient(165deg, ${t.edge}, rgba(255,255,255,0.06) 45%, ${t.edge})`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 18px 44px -22px ${t.glow}`,
        }}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(1.5rem-1px)] bg-surface-2/80 p-5 backdrop-blur-xl">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[3px] opacity-90"
            style={{ background: t.gradient, boxShadow: `0 2px 16px ${t.glow}` }}
          />
          <div
            className="pointer-events-none absolute -top-20 right-0 size-44 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-60"
            style={{ background: t.gradient, opacity: 0.2 }}
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-wider text-ink-muted uppercase">{title}</p>
              <div className="mt-2 leading-none font-black tracking-tight text-ink tabular-nums">{value}</div>
              <p className="mt-2.5 text-[11px] font-medium leading-snug text-ink-muted">{sub}</p>
            </div>
            <div
              className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 text-white"
              style={{
                background: t.gradient,
                boxShadow: `0 10px 26px -8px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.35)`,
              }}
            >
              <Icon className="absolute size-5 transition-transform duration-300 group-hover:scale-110" />
            </div>
          </div>

          <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            {footer}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Chip({ children, icon: Icon, className }: { children: ReactNode; icon?: LucideIcon; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-3/70 px-2.5 py-1 text-[10px] font-bold text-ink-soft',
        className,
      )}
    >
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}

function TrendChip({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <Chip>Sin histórico mensual</Chip>;
  }
  const up = delta >= 0;
  return (
    <Chip
      icon={up ? TrendingUp : TrendingDown}
      className={up ? 'border-red-500/25 text-red-400' : 'border-emerald-500/30 text-emerald-400'}
    >
      {Math.abs(delta).toFixed(1)} pts vs mes precedente
    </Chip>
  );
}

function NivelMini({ tasa }: { tasa: number }) {
  const cfg =
    tasa >= 25
      ? { c: 'border-red-500/25 text-red-400', dot: 'bg-red-400', label: 'Crítico' }
      : tasa >= 10
        ? { c: 'border-amber-500/25 text-amber-400', dot: 'bg-amber-400', label: 'Medio' }
        : { c: 'border-emerald-500/30 text-emerald-400', dot: 'bg-emerald-400', label: 'Bajo' };
  return (
    <Chip icon={AlertTriangle} className={cfg.c}>
      <span className={cn('size-1.5 rounded-full', cfg.dot)} />
      Nivel {cfg.label}
    </Chip>
  );
}

export function DesercionKpis({ data }: { data: DesercionAnalisis }) {
  const deltaTasa = useMemo(() => {
    const months = data.tendencia.filter((t) => t.ingresos > 0);
    if (months.length < 2) return null;
    const last = months[months.length - 1];
    const prev = months[months.length - 2];
    return last.tasa - prev.tasa;
  }, [data.tendencia]);

  const shareCaidas = data.totalDeserciones > 0 ? (data.bajas / data.totalDeserciones) * 10 : 0;
  const mesMayorTasa = data.ranking[0]?.tasa ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <CrystalKpi
        index={0}
        title="Tasa de deserción"
        value={<CountUp value={data.tasaDesercion} format="percent" />}
        sub="Deserciones ÷ Total de ingresos × 100"
        icon={Percent}
        tone="red"
        footer={<TrendChip delta={deltaTasa} />}
      />
      <CrystalKpi
        index={1}
        title="Bajas durante capacitación"
        value={
          <span className="inline-flex flex-wrap items-baseline gap-x-2 text-[26px]">
            <CountUp value={data.bajas} />
            <span className="text-base font-black text-amber-400 tabular-nums">{data.bajasPct.toFixed(1)}%</span>
          </span>
        }
        sub="Abandonaron o fueron retirados en el proceso de capacitación"
        icon={TrendingDown}
        tone="amber"
        footer={
          <Chip icon={TrendingDown} className="border-amber-500/25 text-amber-400">
            {shareCaidas.toFixed(1)} de cada 10 caídas
          </Chip>
        }
      />
      <CrystalKpi
        index={2}
        title="Mes con mayor deserción"
        value={
          data.mesMayor ? (
            <span className="gradient-text text-[24px] tracking-wide uppercase">{data.mesMayor.mes}</span>
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
        footer={<NivelMini tasa={mesMayorTasa} />}
      />
    </div>
  );
}