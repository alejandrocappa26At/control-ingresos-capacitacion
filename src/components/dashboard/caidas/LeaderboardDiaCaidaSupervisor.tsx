'use client';

import { motion } from 'framer-motion';
import { CalendarDays, Crown, Trophy } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import type { CaidaDimensionDia } from '@/services/analytics/falls';

const RANK_STYLES = [
  {
    ring: 'ring-amber-400/60',
    text: 'text-amber-700',
    bg: 'from-amber-200/70 to-amber-400/30',
    label: 'border-amber-400/40 bg-amber-100 text-amber-700',
  },
  {
    ring: 'ring-zinc-300/50',
    text: 'text-zinc-600',
    bg: 'from-zinc-200/60 to-zinc-400/30',
    label: 'border-zinc-300/40 bg-zinc-100 text-zinc-600',
  },
  {
    ring: 'ring-orange-500/50',
    text: 'text-orange-600',
    bg: 'from-orange-200/60 to-orange-400/30',
    label: 'border-orange-400/40 bg-orange-100 text-orange-700',
  },
  {
    ring: 'ring-line',
    text: 'text-ink-soft',
    bg: 'from-surface-3/80 to-surface-3/40',
    label: 'border-line bg-surface-3/60 text-ink-soft',
  },
];

interface LeaderboardDiaCaidaSupervisorProps {
  data: CaidaDimensionDia[];
  totalCaidas: number;
  subtitle?: string;
}

export function LeaderboardDiaCaidaSupervisor({
  data,
  totalCaidas,
  subtitle,
}: LeaderboardDiaCaidaSupervisorProps) {
  const rows = [...data]
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total || (b.diaPromedio ?? 0) - (a.diaPromedio ?? 0))
    .slice(0, 10);
  const max = Math.max(...rows.map((r) => r.total), 1);
  const pctDelTotal = (n: number) => (totalCaidas > 0 ? (n / totalCaidas) * 100 : 0);

  if (rows.length === 0) {
    return (
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-card">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_280px_at_18%_-14%,rgba(244,63,94,0.12),transparent_65%)]" />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 py-10 text-center text-ink-soft">
          <Trophy className="size-5 text-ink-muted" />
          <p className="text-sm font-medium">No hay supervisores con día de caída registrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_280px_at_18%_-14%,rgba(244,63,94,0.08),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />

      <div className="relative mb-4 flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
          <Trophy className="size-4" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-bold tracking-wide text-ink uppercase">Caídas por supervisor</p>
          <p className="truncate text-xs text-ink-soft">Volumen · día promedio · % del total{subtitle ? ` · ${subtitle}` : ''}</p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col justify-center gap-2">
        {rows.map((r, i) => {
          const s = RANK_STYLES[Math.min(i, 3)];
          const pct = max > 0 ? (r.total / max) * 100 : 0;
          const pctTotal = pctDelTotal(r.total);
          const isChampion = i === 0;
          return (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-2.5 pr-3 transition-all duration-200 hover:-translate-y-0.5',
                isChampion
                  ? cn('border-amber-400/40 bg-gradient-to-r', s.bg)
                  : 'border-line bg-surface-3/40 hover:border-rose-400/30 hover:bg-rose-500/[0.06]',
              )}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-black',
                  isChampion
                    ? 'border-amber-400/40 bg-amber-200/70 text-amber-700'
                    : 'border-line bg-surface-3/60 text-ink-soft',
                )}
              >
                {isChampion ? <Crown className="size-3.5" /> : i + 1}
              </span>

              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b text-sm font-black ring-1',
                  s.text,
                  s.bg,
                  s.ring,
                )}
              >
                {r.name.charAt(0)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{r.name}</p>
                <p className="flex items-center gap-1 text-[11px] text-ink-soft">
                  <CalendarDays className="size-3 text-rose-600" />
                  Día promedio
                  <span className="font-bold text-rose-600">{r.diaPromedio != null ? r.diaPromedio.toFixed(1) : '—'}</span>
                </p>
              </div>

              <div className="hidden min-w-16 shrink-0 sm:block">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pct, 4)}%` }}
                    transition={{ delay: 0.25 + i * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400"
                  />
                </div>
              </div>

              <span
                className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-black tabular-nums', s.label)}
              >
                {formatNumber(r.total)} · {pctTotal.toFixed(1)}%
              </span>
            </motion.div>
          );
        })}
      </div>

      <p className="relative mt-3 text-center text-[11px] font-medium text-ink-soft">
        Volumen de caídas, día promedio y participación por supervisor · {formatNumber(totalCaidas)} caídas en el periodo
      </p>
    </div>
  );
}