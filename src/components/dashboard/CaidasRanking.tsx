'use client';

import { TrendingDown } from 'lucide-react';
import { HorizontalRankingChart } from '@/components/charts/charts';
import type { CaidaRanking } from '@/types';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function CaidasRanking({ motivo, subMotivo, total }: { motivo: CaidaRanking[]; subMotivo: CaidaRanking[]; total: number }) {
  const maxMotivo = Math.max(...motivo.map((m) => m.cantidad), 1);
  const maxSub = Math.max(...subMotivo.map((s) => s.cantidad), 1);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RankingCard
        title="Ranking por motivo de caída"
        subtitle={`${formatNumber(total)} caídas analizadas`}
        tone="from-rose-500/25 to-rose-500/5 text-rose-400"
        bars={motivo.map((m) => ({ name: m.motivo, value: m.cantidad, max: maxMotivo, porcentaje: m.porcentaje, color: 'gradient-danger' }))}
      />
      <RankingCard
        title="Ranking por submotivo de caída"
        subtitle={`${formatNumber(total)} caídas analizadas`}
        tone="from-amber-500/25 to-amber-500/5 text-amber-400"
        bars={subMotivo.map((s) => ({ name: s.motivo, value: s.cantidad, max: maxSub, porcentaje: s.porcentaje, color: 'gradient-warning' }))}
      />

      {total > 0 && (
        <div className="rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-all duration-300 hover:shadow-glow lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-[#ff2735]/25 to-[#ff2735]/5 text-[#ff8b8f] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <TrendingDown className="size-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">Distribución por motivo (interactivo)</p>
              <p className="text-xs text-ink-soft">Haz hover sobre las barras para ver el detalle</p>
            </div>
          </div>
          <HorizontalRankingChart data={motivo.map((m) => ({ name: m.motivo, value: m.cantidad }))} height={Math.max(180, motivo.length * 40)} />
        </div>
      )}
    </div>
  );
}

function RankingCard({
  title,
  subtitle,
  tone,
  bars,
}: {
  title: string;
  subtitle: string;
  tone: string;
  bars: Array<{ name: string; value: number; max: number; porcentaje: number; color: string }>;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow">
      <div className="mb-3 flex items-center gap-2">
        <span className={cn('flex size-8 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]', tone)}>
          <TrendingDown className="size-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">{title}</p>
          <p className="text-xs text-ink-soft">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-3">
        {bars.map((b, i) => (
          <RankingBar key={b.name} name={b.name} value={b.value} max={b.max} porcentaje={b.porcentaje} color={b.color} delay={i * 0.05} />
        ))}
      </div>
    </div>
  );
}

function RankingBar({ name, value, max, porcentaje, color, delay }: { name: string; value: number; max: number; porcentaje: number; color: string; delay: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="truncate font-semibold text-ink" title={name}>{name}</span>
        <span className="shrink-0 font-bold text-ink-muted tabular-nums">
          {formatNumber(value)} · {porcentaje.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
          style={{ width: `${(value / max) * 100}%`, transitionDelay: `${delay}s` }}
        />
      </div>
    </div>
  );
}