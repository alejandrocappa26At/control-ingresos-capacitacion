'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { CalendarClock, Flame } from 'lucide-react';
import { ChartCard } from '@/components/charts/ChartCard';
import { cn, formatNumber } from '@/lib/utils';
import type { MomentoSalida } from '@/services/analytics/falls';

const MAX_BLOCKS = 26;
const BLOCKS_WIDE = 5;

type Tier = 'high' | 'mid' | 'low';

const TIER_TOP: Record<Tier, [number, number, number]> = {
  high: [220, 38, 38],
  mid: [249, 115, 22],
  low: [107, 114, 128],
};

const TIER_GLOW: Record<Tier, string> = {
  high: '220,38,38',
  mid: '249,115,22',
  low: '107,114,128',
};

function mix(c1: [number, number, number], c2: [number, number, number], t: number): string {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function tierFor(value: number, max: number): Tier {
  const r = max > 0 ? value / max : 0;
  if (r >= 0.5) return 'high';
  if (r >= 0.2) return 'mid';
  return 'low';
}

function estadoFor(name: string): { label: string; emoji: string; cls: string } {
  if (name === 'Nunca asistió') {
    return { label: 'CRÍTICO', emoji: '🔴', cls: 'border-red-400/40 bg-red-500/10 text-red-400' };
  }
  const day = parseInt(name.replace(/\D/g, ''), 10);
  if (day >= 1 && day <= 3) {
    return { label: 'TEMPRANO', emoji: '🟠', cls: 'border-orange-400/40 bg-orange-500/10 text-orange-400' };
  }
  if (day >= 4 && day <= 6) {
    return { label: 'INTERMEDIO', emoji: '🟡', cls: 'border-amber-400/40 bg-amber-500/10 text-amber-400' };
  }
  if (day >= 7 && day <= 10) {
    return { label: 'TARDÍO', emoji: '🟢', cls: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-400' };
  }
  return { label: '—', emoji: '⚪', cls: 'border-zinc-400/30 bg-zinc-500/10 text-zinc-500' };
}

function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const spring = useSpring(value, { stiffness: 140, damping: 22 });
  const text = useTransform(spring, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{text}</motion.span>;
}

function PanelCard({
  icon,
  label,
  glowKey,
  children,
}: {
  icon: string;
  label: string;
  glowKey: string;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface-3/50 px-3 py-2.5">
      <motion.span
        key={glowKey}
        initial={{ opacity: 0.18 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0 rounded-xl shadow-[0_0_18px_rgba(220,38,38,0.18)]"
      />
      <div className="relative flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-ink-soft uppercase">
        <span>{icon}</span>
        {label}
      </div>
      <div className="relative mt-1">{children}</div>
    </div>
  );
}

function Level({
  tone,
  tier,
  active,
  delay,
}: {
  tone: number;
  tier: Tier;
  active: boolean;
  delay: number;
}) {
  const top = TIER_TOP[tier];
  const base = top.map((v) => Math.round(v * 0.3)) as [number, number, number];
  const color = mix(base, top, tone);
  const glowRGB = TIER_GLOW[tier];
  const glowAlpha = tier === 'low' ? 0.12 : 0.28;
  const shadow = active
    ? `0 0 9px 2px rgba(${glowRGB},0.4)`
    : `0 0 6px 1px rgba(${glowRGB},${glowAlpha})`;
  const brightness = (active ? 1.5 : 1) * (0.72 + tone * 0.48);

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformOrigin: 'bottom' }}
      className="flex gap-[1px]"
    >
      {Array.from({ length: BLOCKS_WIDE }).map((_, c) => (
        <span
          key={c}
          className="size-[8px] rounded-[2px]"
          style={{ backgroundColor: color, boxShadow: shadow, filter: `brightness(${brightness})` }}
        />
      ))}
    </motion.div>
  );
}

export function CaidasPorMomentoSalidaChart({ data }: { data: MomentoSalida[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const max = Math.max(1, ...data.map((d) => d.value));
  const promedio = data.length > 0 ? total / data.length : 0;
  const pico = data.reduce<MomentoSalida | null>(
    (acc, d) => (acc && acc.value >= d.value ? acc : d),
    data[0] ?? null,
  );
  const picoIndex = pico ? data.findIndex((d) => d.name === pico.name) : -1;
  const [active, setActive] = useState<number | null>(null);
  const shown = data[active ?? picoIndex];

  const ranked = [...data].sort((a, b) => b.value - a.value);
  const rankOf = (name: string) => ranked.findIndex((r) => r.name === name) + 1;

  const scaleBlocks = (v: number) => (v > 0 ? Math.max(1, Math.round((v / max) * MAX_BLOCKS)) : 0);

  if (total === 0) {
    return (
      <ChartCard
        title="Caídas por momento de salida"
        description="Solo registros con PASA A OPERACIONES = No · Nunca asistió y Día 1 al 10"
        icon={<CalendarClock className="size-4" />}
      >
        <div className="flex h-52 flex-col items-center justify-center gap-2 text-ink-soft">
          <Flame className="size-5 text-ink-muted" />
          <p className="text-sm font-medium">No hay caídas con momento de salida registrado.</p>
        </div>
      </ChartCard>
    );
  }

  const estado = estadoFor(shown.name);

  return (
    <ChartCard
      title="Caídas por momento de salida"
      description="Panel ejecutivo dinámico · pasá el cursor sobre las columnas"
      icon={<CalendarClock className="size-4" />}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <PanelCard icon="📍" label="Momento de salida" glowKey={shown.name}>
          <span className="text-base font-black text-ink">{shown.name}</span>
        </PanelCard>
        <PanelCard icon="👥" label="Promotores" glowKey={shown.name}>
          <span className="text-xl font-black tabular-nums text-ink">
            <CountUp value={shown.value} />
          </span>
        </PanelCard>
        <PanelCard icon="📊" label="Participación" glowKey={shown.name}>
          <span className="text-xl font-black tabular-nums text-ink">
            <CountUp value={shown.porcentaje} decimals={1} suffix="%" />
          </span>
        </PanelCard>
        <PanelCard icon="⚠" label="Estado" glowKey={shown.name}>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-black',
              estado.cls,
            )}
          >
            {estado.emoji} {estado.label}
          </span>
        </PanelCard>
        <PanelCard icon="🏆" label="Ranking" glowKey={shown.name}>
          <span className="text-xl font-black tabular-nums text-ink">
            <CountUp value={rankOf(shown.name)} prefix="#" />{' '}
            <span className="text-xs font-bold text-ink-muted">de {data.length}</span>
          </span>
        </PanelCard>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {pico && pico.value > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-2.5 py-1.5">
            <span className="text-sm leading-none">🔥</span>
            <span className="text-[10px] font-black tracking-wider text-red-600 uppercase">
              Punto crítico
            </span>
            <span className="text-sm font-black text-ink">{pico.name}</span>
            <span className="text-sm font-black tabular-nums text-red-600">
              {formatNumber(pico.value)}
            </span>
            <span className="rounded-full border border-red-400/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
              {pico.porcentaje.toFixed(1)}%
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 text-[10px] font-semibold text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-[#dc2626]" />
            Alto
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-[#f97316]" />
            Medio
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-[#94a3b8]" />
            Bajo
          </span>
        </div>
      </div>

      <div className="relative mt-3 h-[280px]">
        <div className="pointer-events-none absolute inset-0 z-0">
          {[0, 20, 40, 60, 80, 100].map((p) => (
            <div
              key={p}
              className="absolute inset-x-0 flex items-center gap-2"
              style={{ top: `${100 - p}%`, transform: 'translateY(-50%)' }}
            >
              <span className="w-6 shrink-0 text-right text-[9px] font-semibold tabular-nums text-ink-muted/80">
                {p}
              </span>
              <div className="h-px flex-1 border-t border-dashed border-line-2" />
            </div>
          ))}
        </div>

        <div className="relative z-10 flex h-full items-end justify-between gap-1 pl-8">
          {data.map((d, i) => {
            const blocks = scaleBlocks(d.value);
            const tier = tierFor(d.value, max);
            const isActive = (active ?? picoIndex) === i;
            const shortName = d.name === 'Nunca asistió' ? 'NUNCA' : d.name.toUpperCase();

            return (
              <div
                key={d.name}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className="relative flex h-full flex-1 flex-col items-center justify-end"
              >
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 rounded-lg border transition-all duration-200',
                    isActive
                      ? 'border-red-400/25 bg-gradient-to-t from-red-500/[0.08] to-transparent'
                      : 'border-transparent',
                  )}
                />

                <div className="flex flex-col-reverse gap-[1px]">
                  {Array.from({ length: blocks }).map((_, r) => {
                    const tone = blocks > 1 ? r / (blocks - 1) : 1;
                    return (
                      <Level
                        key={r}
                        tone={tone}
                        tier={tier}
                        active={isActive}
                        delay={0.15 + i * 0.05 + (blocks - r) * 0.012}
                      />
                    );
                  })}
                </div>

                <div
                  className={cn(
                    'mt-1 text-[8px] font-bold tracking-wide whitespace-nowrap transition-colors sm:text-[9px]',
                    isActive ? 'text-red-400' : 'text-ink-muted',
                  )}
                >
                  {shortName}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
        <span>
          Total de caídas: <b className="tabular-nums text-ink">{formatNumber(total)}</b>
        </span>
        <span>Promedio por momento: {promedio.toFixed(1)} promotores</span>
      </div>
    </ChartCard>
  );
}