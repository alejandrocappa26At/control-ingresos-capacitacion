'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Calendar,
  Footprints,
  Percent,
  PieChart,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { ChartCard } from '@/components/charts/ChartCard';
import type { TendenciaMensual } from '@/services/analytics/desercion';

const ING_GRADIENT = 'linear-gradient(180deg, #93c5fd 0%, #2563eb 42%, #1d4ed8 100%)';
const DESC_GRADIENT = 'linear-gradient(180deg, #ff8a8c 0%, #ff4d4f 40%, #d90429 100%)';
const ING_GLOW = 'rgba(37,99,235,0.5)';
const DESC_GLOW = 'rgba(255,77,79,0.45)';

function crystalShadow(isIng: boolean, active: boolean): string {
  const glow = isIng ? ING_GLOW : DESC_GLOW;
  const base = active ? `0 18px 38px -12px ${glow}` : `0 10px 26px -14px ${glow}`;
  return `inset 0 2px 6px rgba(255,255,255,0.35), inset 0 -10px 18px rgba(0,0,0,0.28), ${base}`;
}

function CrystalBar({
  pct,
  active,
  hovered,
  isIng,
  delay,
}: {
  pct: number;
  active: boolean;
  hovered: boolean;
  isIng: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      style={{
        transformOrigin: 'bottom',
        height: `${Math.max(pct, 0.8)}%`,
        background: isIng ? ING_GRADIENT : DESC_GRADIENT,
        boxShadow: crystalShadow(isIng, active),
        border: '1px solid rgba(255,255,255,0.18)',
      }}
      className={cn(
        'w-full max-w-[52px] rounded-t-[10px] rounded-b-[4px] transition-[opacity,filter,transform] duration-300',
        active
          ? 'brightness-[1.2] saturate-[1.15]'
          : cn('saturate-[0.7]', !hovered && 'opacity-55'),
      )}
    />
  );
}

function StatCard({
  label,
  value,
  chip,
  glow,
  accent,
}: {
  label: string;
  value: string;
  chip: string;
  glow: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-2/70 px-3.5 py-2.5 backdrop-blur-xl">
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: chip, boxShadow: `0 0 12px ${glow}` }} />
      <div className="flex items-center gap-2.5 pl-2">
        <span className="size-2.5 shrink-0 rounded-[4px]" style={{ background: chip, boxShadow: `0 0 10px ${glow}` }} />
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold tracking-wider text-ink-soft uppercase">{label}</span>
          <span className={cn('text-lg leading-tight font-black tabular-nums', accent)}>{value}</span>
        </div>
      </div>
    </div>
  );
}

function PanelCell({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5"
        style={{ boxShadow: `0 0 14px -4px ${color}` }}
      >
        <Icon className="size-4" style={{ color }} />
      </span>
      <div className="leading-tight">
        <p className="text-[9px] font-bold tracking-wider text-ink-soft uppercase">{label}</p>
        <p className="text-sm font-black text-ink tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function NivelBadge({ tasa }: { tasa: number }) {
  const cfg =
    tasa >= 25
      ? { c: 'border-red-500/40 bg-red-500/15 text-red-400', dot: 'bg-red-400', label: 'Crítico' }
      : tasa >= 10
        ? { c: 'border-amber-500/40 bg-amber-500/15 text-amber-400', dot: 'bg-amber-400', label: 'Medio' }
        : { c: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400', label: 'Bajo' };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wide uppercase',
        cfg.c,
      )}
    >
      <AlertTriangle className="size-3" />
      {cfg.label}
    </span>
  );
}

export function TendenciaIngresosDeserciones({ data }: { data: TendenciaMensual[] }) {
  const totalIngresos = data.reduce((s, d) => s + d.ingresos, 0);
  const totalDeserciones = data.reduce((s, d) => s + d.deserciones, 0);
  const tasaGlobal = totalIngresos > 0 ? (totalDeserciones / totalIngresos) * 100 : 0;
  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.ingresos, d.deserciones)));

  const defaultIdx =
    data.length > 0 ? data.reduce((best, d, i) => (d.deserciones > data[best].deserciones ? i : best), 0) : 0;
  const [active, setActive] = useState<number | null>(null);
  const shown = data[active ?? defaultIdx];
  const shownParticipacion = totalDeserciones > 0 ? (shown.deserciones / totalDeserciones) * 100 : 0;

  if (data.length === 0) {
    return (
      <ChartCard
        title="Ingresos vs Deserciones"
        description="Crystal Executive Bar Chart · relación mensual"
        icon={<TrendingUp className="size-4" />}
      >
        <div className="flex h-52 items-center justify-center text-sm text-ink-soft">
          Sin datos para el periodo.
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Ingresos vs Deserciones"
      description="Crystal Executive Bar Chart · relación mensual"
      icon={<TrendingUp className="size-4" />}
      toolbar={
        <div className="flex items-center gap-4 text-[11px] font-bold text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[3px] bg-[#2563eb] shadow-[0_0_8px_rgba(37,99,235,0.7)]" />
            Ingresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-[3px] bg-[#ff4d4f] shadow-[0_0_8px_rgba(255,77,79,0.7)]" />
            Deserciones
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatCard
          label="Ingresos totales"
          value={formatNumber(totalIngresos)}
          chip="linear-gradient(180deg,#3b82f6,#1d4ed8)"
          glow="rgba(37,99,235,0.5)"
          accent="text-blue-400"
        />
        <StatCard
          label="Deserciones totales"
          value={formatNumber(totalDeserciones)}
          chip="linear-gradient(180deg,#ff4d4f,#d90429)"
          glow="rgba(255,77,79,0.5)"
          accent="text-red-400"
        />
        <StatCard
          label="Tasa global"
          value={`${tasaGlobal.toFixed(1)}%`}
          chip="linear-gradient(180deg,#f43f5e,#be123c)"
          glow="rgba(244,63,94,0.45)"
          accent="text-ink"
        />
      </div>

      <div
        className="relative mt-4 rounded-2xl p-px"
        style={{ background: 'linear-gradient(165deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03))' }}
      >
        <div className="rounded-[15px] bg-surface-2/60 px-4 py-3 backdrop-blur-xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={shown.mes}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-x-5 gap-y-2"
            >
              <div className="flex items-center gap-2 border-r border-white/10 pr-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg gradient-brand text-white shadow-[0_0_18px_rgba(227,6,19,0.5)]">
                  <Calendar className="size-4" />
                </span>
                <div className="leading-tight">
                  <p className="text-[9px] font-bold tracking-wider text-ink-soft uppercase">Mes ejecutivo</p>
                  <p className="text-sm leading-tight font-black text-ink">{shown.mes}</p>
                </div>
              </div>
              <PanelCell icon={Users} label="Ingresos" value={formatNumber(shown.ingresos)} color="#2563eb" />
              <PanelCell icon={Footprints} label="Deserciones" value={formatNumber(shown.deserciones)} color="#ff4d4f" />
              <PanelCell icon={Percent} label="Tasa" value={`${shown.tasa.toFixed(1)}%`} color="#fbbf24" />
              <PanelCell
                icon={PieChart}
                label="Participación"
                value={`${shownParticipacion.toFixed(1)}%`}
                color="#f472b6"
              />
              <span className="ml-auto">
                <NivelBadge tasa={shown.tasa} />
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative mt-4 h-[300px]">
        <div className="pointer-events-none absolute inset-x-0 inset-y-0 z-0">
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

        <div className="relative z-10 flex h-full items-end gap-1 pl-8">
          {data.map((m, i) => {
            const ingPct = m.ingresos > 0 ? (m.ingresos / maxValue) * 100 : 0;
            const descPct = m.deserciones > 0 ? (m.deserciones / maxValue) * 100 : 0;
            const isActive = active === i;
            const anyHover = active !== null;

            return (
              <div
                key={m.mes}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
              >
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 rounded-lg border transition-all duration-200',
                    isActive
                      ? 'border-white/20 bg-white/[0.04]'
                      : 'border-transparent',
                  )}
                />

                <div className="flex h-full w-full items-end justify-center gap-1.5 sm:gap-2">
                  <CrystalBar pct={ingPct} active={isActive} hovered={anyHover} isIng delay={0.15 + i * 0.05} />
                  <CrystalBar pct={descPct} active={isActive} hovered={anyHover} isIng={false} delay={0.21 + i * 0.05} />
                </div>

                <div
                  className={cn(
                    'mt-1.5 text-[9px] font-bold tracking-[0.08em] uppercase transition-colors',
                    isActive ? 'text-brand-400' : 'text-ink-muted group-hover:text-ink-soft',
                  )}
                >
                  {m.mes.slice(0, 3)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ChartCard>
  );
}