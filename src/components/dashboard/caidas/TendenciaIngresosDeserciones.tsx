'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { ChartCard } from '@/components/charts/ChartCard';
import type { TendenciaMensual } from '@/services/analytics/desercion';

const ING_GRADIENT = 'linear-gradient(to top, #1d4ed8 0%, #2563eb 55%, #3b82f6 100%)';
const DESC_GRADIENT = 'linear-gradient(to top, #b91c1c 0%, #dc2626 55%, #ef4444 100%)';

function Bar({
  pct,
  active,
  kind,
  delay,
}: {
  pct: number;
  active: boolean;
  kind: 'ing' | 'desc';
  delay: number;
}) {
  const isIng = kind === 'ing';
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        transformOrigin: 'bottom',
        height: `${Math.max(pct, 0.6)}%`,
        background: isIng ? ING_GRADIENT : DESC_GRADIENT,
        boxShadow: active
          ? isIng
            ? '0 4px 12px -4px rgba(37,99,235,0.45)'
             : '0 4px 12px -4px rgba(220,38,38,0.45)'
          : isIng
            ? '0 2px 8px -3px rgba(37,99,235,0.3)'
            : '0 2px 8px -3px rgba(220,38,38,0.3)',
        filter: active ? 'brightness(1.15)' : 'brightness(1)',
      }}
      className={cn(
        'w-[12px] rounded-t-[5px] sm:w-[16px]',
        isIng ? 'border-t border-white/90' : 'border-t border-red-300/70',
      )}
    />
  );
}

function StatCard({
  label,
  value,
  chip,
  accent,
}: {
  label: string;
  value: string;
  chip: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-3/50 px-3.5 py-2.5">
      <span className={cn('size-2.5 shrink-0 rounded-[3px]', chip)} />
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold tracking-wider text-ink-soft uppercase">
          {label}
        </span>
        <span className={cn('text-lg leading-tight font-black tabular-nums', accent)}>{value}</span>
      </div>
    </div>
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
        description="Equalizer ejecutivo · proporcional al máximo"
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
      description="Equalizer ejecutivo · altura proporcional al máximo"
      icon={<TrendingUp className="size-4" />}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatCard
          label="Ingresos totales"
          value={formatNumber(totalIngresos)}
          chip="bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] shadow-[0_2px_8px_-2px_rgba(37,99,235,0.4)]"
          accent="text-blue-600"
        />
        <StatCard
          label="Deserciones totales"
          value={formatNumber(totalDeserciones)}
          chip="bg-gradient-to-b from-[#ef4444] to-[#b91c1c] shadow-[0_2px_8px_-2px_rgba(220,38,38,0.4)]"
          accent="text-red-600"
        />
        <StatCard
          label="Tasa global"
          value={`${tasaGlobal.toFixed(1)}%`}
          chip="bg-gradient-to-b from-rose-400 to-rose-600 shadow-[0_2px_8px_-2px_rgba(244,63,94,0.35)]"
          accent="text-ink"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-surface-3/40 px-3.5 py-2.5 text-xs transition-colors">
        <span className="flex items-center gap-1.5 font-black tracking-wide text-ink uppercase">
          📅 {shown.mes}
        </span>
        <span className="flex items-center gap-1.5 text-ink-soft">
          👥 Ingresos: <b className="tabular-nums text-blue-700">{formatNumber(shown.ingresos)}</b>
        </span>
        <span className="flex items-center gap-1.5 text-ink-soft">
          🚶 Deserciones: <b className="tabular-nums text-red-600">{formatNumber(shown.deserciones)}</b>
        </span>
        <span className="flex items-center gap-1.5 text-ink-soft">
          📉 Tasa de deserción: <b className="tabular-nums text-ink">{shown.tasa.toFixed(1)}%</b>
        </span>
        <span className="flex items-center gap-1.5 text-ink-soft">
          📊 Participación anual: <b className="tabular-nums text-ink">{shownParticipacion.toFixed(1)}%</b>
        </span>
        <span className="ml-auto">
          <EstadoBadge tasa={shown.tasa} />
        </span>
      </div>

      <div className="relative mt-3 h-[280px]">
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

        <div className="relative z-10 flex h-full items-end justify-between gap-1 pl-8">
          {data.map((m, i) => {
            const ingPct = m.ingresos > 0 ? (m.ingresos / maxValue) * 100 : 0;
            const descPct = m.deserciones > 0 ? (m.deserciones / maxValue) * 100 : 0;
            const isActive = active === i;

            return (
              <div
                key={m.mes}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                className="relative flex h-full flex-1 flex-col items-center justify-end"
              >
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 rounded-lg border transition-all duration-200',
                    isActive
                      ? 'border-brand-500/30 bg-gradient-to-t from-brand-500/[0.06] to-transparent'
                      : 'border-transparent',
                  )}
                />

                <div className="flex h-full items-end gap-[3px] sm:gap-1">
                  <Bar pct={ingPct} active={isActive} kind="ing" delay={0.15 + i * 0.05} />
                  <Bar pct={descPct} active={isActive} kind="desc" delay={0.21 + i * 0.05} />
                </div>

                <div
                  className={cn(
                    'mt-1 text-[9px] font-bold tracking-[0.08em] uppercase transition-colors',
                    isActive ? 'text-brand-600' : 'text-ink-muted',
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

function EstadoBadge({ tasa }: { tasa: number }) {
  if (tasa >= 25) {
    return (
      <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-red-600">
        🔴 Crítico
      </span>
    );
  }
  if (tasa >= 10) {
    return (
      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-amber-600">
        🟡 Medio
      </span>
    );
  }
  return (
    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-emerald-600">
      🟢 Bajo
    </span>
  );
}