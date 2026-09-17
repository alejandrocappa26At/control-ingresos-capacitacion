'use client';

import { motion } from 'framer-motion';
import type { EChartsOption } from 'echarts';
import {
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  TrendingDown,
  Users,
  UserX,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import { Tooltip } from '@/components/ui/tooltip';
import { ChartCard } from '@/components/charts/ChartCard';
import { QiEChart, tipHeader, tipRow } from '@/components/charts/EChart';
import type { EmbudoCapacitacion } from '@/services/analytics/falls';

type Tone = 'blue' | 'purple' | 'gray' | 'red' | 'green';

const TONES: Record<Tone, { icon: string; tile: string; bar: string; line: string; orb: string; glow: string }> = {
  blue: {
    icon: 'text-sky-400',
    tile: 'from-sky-500/30 to-sky-500/5',
    bar: 'from-sky-500 via-cyan-400 to-blue-600',
    line: 'via-sky-400/40',
    orb: 'rgba(56,189,248,0.28)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(56,189,248,0.45)]',
  },
  purple: {
    icon: 'text-violet-400',
    tile: 'from-violet-500/30 to-violet-500/5',
    bar: 'from-violet-500 via-purple-400 to-fuchsia-600',
    line: 'via-violet-400/40',
    orb: 'rgba(167,139,250,0.28)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(167,139,250,0.45)]',
  },
  gray: {
    icon: 'text-zinc-400',
    tile: 'from-zinc-500/30 to-zinc-500/5',
    bar: 'from-zinc-400 via-zinc-500 to-zinc-700',
    line: 'via-zinc-400/40',
    orb: 'rgba(161,161,170,0.22)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(113,113,122,0.45)]',
  },
  red: {
    icon: 'text-rose-400',
    tile: 'from-rose-500/30 to-rose-500/5',
    bar: 'from-rose-500 via-pink-400 to-fuchsia-500',
    line: 'via-rose-400/40',
    orb: 'rgba(244,63,94,0.28)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(239,68,68,0.45)]',
  },
  green: {
    icon: 'text-emerald-400',
    tile: 'from-emerald-500/30 to-emerald-500/5',
    bar: 'from-emerald-500 via-teal-400 to-green-600',
    line: 'via-emerald-400/40',
    orb: 'rgba(52,211,153,0.28)',
    glow: 'hover:shadow-[0_16px_60px_-12px_rgba(16,185,129,0.45)]',
  },
};

type BadgeTone = 'blue' | 'purple' | 'grayred' | 'red' | 'green';

const BADGE_TONES: Record<BadgeTone, { text: string; border: string; on: string; off: string; glow: string }> = {
  blue: {
    text: 'text-sky-300',
    border: 'border-sky-400/40',
    on: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]',
    off: 'bg-sky-400/15',
    glow: 'shadow-[0_10px_28px_-10px_rgba(56,189,248,0.6)]',
  },
  purple: {
    text: 'text-violet-300',
    border: 'border-violet-400/40',
    on: 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]',
    off: 'bg-violet-400/15',
    glow: 'shadow-[0_10px_28px_-10px_rgba(167,139,250,0.6)]',
  },
  grayred: {
    text: 'text-zinc-300',
    border: 'border-zinc-400/40',
    on: 'bg-rose-400/90 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
    off: 'bg-zinc-400/15',
    glow: 'shadow-[0_10px_28px_-10px_rgba(244,63,94,0.55)]',
  },
  red: {
    text: 'text-rose-300',
    border: 'border-rose-400/40',
    on: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.9)]',
    off: 'bg-rose-400/15',
    glow: 'shadow-[0_10px_28px_-10px_rgba(244,63,94,0.65)]',
  },
  green: {
    text: 'text-emerald-300',
    border: 'border-emerald-400/40',
    on: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
    off: 'bg-emerald-400/15',
    glow: 'shadow-[0_10px_28px_-10px_rgba(52,211,153,0.6)]',
  },
};

const TONE_TO_BADGE: Record<Tone, BadgeTone> = {
  blue: 'blue',
  purple: 'purple',
  gray: 'grayred',
  red: 'red',
  green: 'green',
};

function PremiumPctBadge({ pct, badgeTone, tooltip }: { pct: number; badgeTone: BadgeTone; tooltip: string }) {
  const b = BADGE_TONES[badgeTone];
  const segments = Array.from({ length: 10 }, (_, i) => i < Math.floor(pct / 10));

  return (
    <Tooltip content={tooltip}>
      <motion.span
        whileHover={{ scale: 1.05, y: -1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        className="mt-2.5 inline-block will-change-transform"
      >
        <span
          className={cn(
            'relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border px-3.5 py-1.5 backdrop-blur-md transition-shadow duration-300',
            'bg-gradient-to-r from-white/[0.10] via-white/[0.05] to-white/[0.02]',
            b.border,
            b.glow,
          )}
        >
          <span
            className={cn(
              'pointer-events-none absolute inset-0 rounded-full blur-[2px]',
              'bg-gradient-to-r from-white/[0.06] to-transparent',
            )}
          />
          <CountUp value={pct} format="percent" duration={1.1} className={cn('relative text-sm leading-none font-bold tabular-nums tracking-tight', b.text)} />
          <span className="relative inline-flex items-center gap-[3px] py-0.5" aria-hidden="true">
            {segments.map((filled, i) => (
              <span key={i} className={cn('h-[5px] w-[5px] flex-none rounded-[2px]', filled ? b.on : b.off)} />
            ))}
          </span>
        </span>
      </motion.span>
    </Tooltip>
  );
}

interface FunnelCardProps {
  index: number;
  step: number;
  title: string;
  value: number;
  pct: number;
  desc: string;
  icon: LucideIcon;
  tone: Tone;
  tooltip?: string;
}

function FunnelCard({ index, step, title, value, pct, desc, icon: Icon, tone, tooltip }: FunnelCardProps) {
  const s = TONES[tone];
  const badgeTone = TONE_TO_BADGE[tone];
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
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-ink">
              <CountUp value={value} />
            </p>
            <PremiumPctBadge
              pct={pct}
              badgeTone={badgeTone}
              tooltip={tooltip ?? `Porcentaje respecto al total de ingresos (${value.toLocaleString('es-PE')})`}
            />
            <p className="mt-2 text-[11px] font-medium leading-snug text-ink-muted">{desc}</p>
          </div>
          <div className="relative flex flex-col items-center gap-1.5">
            <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]', s.tile)}>
              <Icon className={cn('size-5 drop-shadow-[0_0_8px_currentColor] transition-transform duration-300 group-hover:scale-110', s.icon)} />
            </div>
            <span className="flex size-5 items-center justify-center rounded-full bg-white/5 text-[10px] font-black tabular-nums text-ink-soft ring-1 ring-white/10">
              {step}
            </span>
          </div>
        </div>

        <div className={cn('absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r opacity-70 transition-opacity duration-300 group-hover:opacity-100', s.bar)} />
      </div>
    </motion.div>
  );
}

function IntegridadBar({ embudo }: { embudo: EmbudoCapacitacion }) {
  const suma = embudo.desercion + embudo.bajas + embudo.pasanOperaciones + embudo.enCapacitacion;

  if (embudo.integridad) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3"
      >
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
        <p className="text-xs font-medium leading-relaxed text-ink-muted">
          <span className="font-bold text-emerald-400">Consistencia verificada.</span>{' '}
          Deserción + Bajas + Pasan a operaciones + En capacitación ({formatNumber(embudo.enCapacitacion)}) = Total de
          ingresos ({formatNumber(embudo.totalIngresos)}).
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" />
      <p className="text-xs font-medium leading-relaxed text-ink-muted">
        <span className="font-bold text-amber-400">Advertencia de integridad de datos.</span> La suma de Deserción,
        Bajas, Pasan a operaciones y En capacitación ({formatNumber(suma)}) no coincide con el Total de ingresos (
        {formatNumber(embudo.totalIngresos)}). Diferencia de {formatNumber(embudo.diferencia)} registro(s) sin clasificar.
        Revisa las columnas TOTAL DE DÍAS y PASA A OPERACIONES del archivo cargado.
      </p>
    </motion.div>
  );
}

const EMBUDO_COLORS: Array<{ name: string; fill: string; glow: string }> = [
  { name: 'Total de ingresos', fill: '#38bdf8', glow: 'rgba(56,189,248,0.5)' },
  { name: 'Inician capacitación', fill: '#a78bfa', glow: 'rgba(167,139,250,0.5)' },
  { name: 'Deserción', fill: '#a1a1aa', glow: 'rgba(244,63,94,0.5)' },
  { name: 'Bajas durante capacitación', fill: '#f43f5e', glow: 'rgba(244,63,94,0.6)' },
  { name: 'Pasan a operaciones', fill: '#34d399', glow: 'rgba(52,211,153,0.5)' },
];

function EmbudoCapacitacion({ embudo }: { embudo: EmbudoCapacitacion }) {
  const steps = [
    { name: 'Total de ingresos', value: embudo.totalIngresos, pct: 100 },
    { name: 'Inician capacitación', value: embudo.inicianCapacitacion, pct: embudo.inicianPct },
    { name: 'Deserción', value: embudo.desercion, pct: embudo.desercionPct },
    { name: 'Bajas durante capacitación', value: embudo.bajas, pct: embudo.bajasPct },
    { name: 'Pasan a operaciones', value: embudo.pasanOperaciones, pct: embudo.pasanPct },
  ].filter((s) => s.value > 0);

  const option: EChartsOption = {
    tooltip: {
      formatter: (params) => {
        const p = params as { name?: string; data?: { value: number; pct: number } };
        const color = EMBUDO_COLORS.find((c) => c.name === p.name)?.fill ?? '#a1a1aa';
        const value = p.data?.value ?? 0;
        const pct = p.data?.pct ?? 0;
        return (
          tipHeader(String(p.name ?? '—')) +
          tipRow(color, 'Registros', formatNumber(value)) +
          tipRow('#a1a1aa', '% del total de ingresos', `${pct.toFixed(1)}%`)
        );
      },
    },
    series: [
      {
        type: 'funnel',
        left: '8%',
        right: '8%',
        top: 8,
        bottom: 8,
        sort: 'none',
        gap: 4,
        minSize: '20%',
        maxSize: '100%',
        label: {
          show: true,
          position: 'inside',
          color: '#0b0f1c',
          fontSize: 11,
          fontWeight: 800,
          formatter: (p) => {
            const d = p.data as { name: string; value: number; pct: number };
            return `${d.name}\n${formatNumber(d.value)} · ${d.pct.toFixed(1)}%`;
          },
        },
        labelLine: { show: false },
        itemStyle: { borderColor: '#0b0f1c', borderWidth: 2, borderRadius: 10, opacity: 0.95 },
        emphasis: { itemStyle: { shadowBlur: 24 } },
        animationDuration: 800,
        animationEasing: 'cubicOut',
        data: steps.map((s) => ({
          name: s.name,
          value: s.value,
          pct: s.pct,
          itemStyle: { color: EMBUDO_COLORS.find((c) => c.name === s.name)?.fill, shadowColor: EMBUDO_COLORS.find((c) => c.name === s.name)?.glow, shadowBlur: 16 },
        })),
      },
    ],
  };

  return (
    <ChartCard
      title="Embudo de Capacitación"
      description="De ingresos a operaciones · pérdida en cada etapa"
      icon={<Workflow className="size-4" />}
    >
      <QiEChart option={option} height={280} />
      <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-medium text-ink-soft">
        <span>
          Conversión total: <span className="font-bold text-emerald-400">{embudo.pasanPct.toFixed(1)}%</span>
        </span>
        <span>
          En capacitación: <span className="font-bold text-ink">{formatNumber(embudo.enCapacitacion)}</span> (
          {embudo.enCapacitacionPct.toFixed(1)}%)
        </span>
      </p>
    </ChartCard>
  );
}

export function CaidasFunnelKPIs({ embudo }: { embudo: EmbudoCapacitacion }) {
  return (
    <div className="space-y-4">
      <IntegridadBar embudo={embudo} />

      <EmbudoCapacitacion embudo={embudo} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <FunnelCard
          index={0}
          step={1}
          title="Total de ingresos"
          value={embudo.totalIngresos}
          pct={100}
          desc="Total de promotores cargados"
          icon={Users}
          tone="blue"
        />
        <FunnelCard
          index={1}
          step={2}
          title="Inician capacitación"
          value={embudo.inicianCapacitacion}
          pct={embudo.inicianPct}
          desc="Con al menos 1 día en capacitación"
          icon={PlayCircle}
          tone="purple"
        />
        <FunnelCard
          index={2}
          step={3}
          title="Deserción"
          value={embudo.desercion}
          pct={embudo.desercionPct}
          desc="Nunca asistieron a capacitación"
          icon={UserX}
          tone="gray"
        />
        <FunnelCard
          index={3}
          step={4}
          title="Bajas durante capacitación"
          value={embudo.bajas}
          pct={embudo.bajasPct}
          desc="Abandonaron o fueron retirados durante capacitación"
          icon={TrendingDown}
          tone="red"
        />
        <FunnelCard
          index={4}
          step={5}
          title="Pasan a operaciones"
          value={embudo.pasanOperaciones}
          pct={embudo.pasanPct}
          desc="Promotores aprobados"
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      <p className="text-center text-[11px] font-semibold tracking-wide text-ink-soft">
        Embudo del proceso: Ingresan → Inician capacitación → Desertan → Caen durante capacitación → Pasan a operaciones
      </p>
    </div>
  );
}