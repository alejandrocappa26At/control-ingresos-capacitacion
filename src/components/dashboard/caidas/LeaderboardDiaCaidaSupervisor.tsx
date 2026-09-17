'use client';

import { motion } from 'framer-motion';
import { CalendarDays, Crown, Trophy } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import type { CaidaDimensionDia } from '@/services/analytics/falls';

const RANK_STYLES = [
  {
    ring: 'ring-amber-400/60',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_26px_rgba(251,191,36,0.35)]',
    bg: 'from-amber-400/30 to-amber-600/10',
    label: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  },
  {
    ring: 'ring-zinc-300/50',
    text: 'text-zinc-200',
    glow: 'shadow-[0_0_22px_rgba(212,212,216,0.25)]',
    bg: 'from-zinc-300/25 to-zinc-500/10',
    label: 'border-zinc-300/30 bg-zinc-300/10 text-zinc-200',
  },
  {
    ring: 'ring-orange-700/50',
    text: 'text-orange-300',
    glow: 'shadow-[0_0_22px_rgba(194,65,12,0.3)]',
    bg: 'from-orange-600/25 to-orange-900/10',
    label: 'border-orange-600/30 bg-orange-600/10 text-orange-200',
  },
  {
    ring: 'ring-white/10',
    text: 'text-ink-soft',
    glow: '',
    bg: 'from-white/10 to-white/[0.02]',
    label: 'border-white/10 bg-white/5 text-ink-soft',
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
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-rose">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_280px_at_18%_-14%,rgba(244,63,94,0.16),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />

      <div className="relative mb-4 flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-rose-500/25 to-rose-500/5 text-rose-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Trophy className="size-4" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-bold tracking-wide text-ink uppercase">Día de caída por supervisor</p>
          <p className="truncate text-xs text-ink-soft">Leaderboard ejecutivo{subtitle ? ` · ${subtitle}` : ''}</p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col justify-center gap-2">
        {rows.map((r, i) => {
          const s = RANK_STYLES[Math.min(i, 3)];
          const pct = max > 0 ? (r.total / max) * 100 : 0;
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
                  ? cn('border-amber-400/25 bg-gradient-to-r', s.bg)
                  : 'border-white/5 bg-white/[0.03] hover:border-rose-400/30 hover:bg-rose-500/[0.06]',
              )}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-black',
                  isChampion
                    ? 'border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.35)]'
                    : 'border-white/10 bg-white/5 text-ink-soft',
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
                  s.glow,
                )}
              >
                {r.name.charAt(0)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{r.name}</p>
                <p className="flex items-center gap-1 text-[11px] text-ink-soft">
                  <CalendarDays className="size-3 text-rose-300" />
                  Día promedio
                  <span className="font-bold text-rose-300">{r.diaPromedio != null ? r.diaPromedio.toFixed(1) : '—'}</span>
                </p>
              </div>

              <div className="hidden min-w-16 shrink-0 sm:block">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(pct, 4)}%` }}
                    transition={{ delay: 0.25 + i * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(227,6,19,0.6)]"
                  />
                </div>
              </div>

              <span
                className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-black tabular-nums', s.label)}
              >
                {formatNumber(r.total)} caídas
              </span>
            </motion.div>
          );
        })}
      </div>

      <p className="relative mt-3 text-center text-[11px] font-medium text-ink-soft">
        Día promedio de caída y volumen de caídas por supervisor · {formatNumber(totalCaidas)} caídas en el periodo
      </p>
    </div>
  );
}