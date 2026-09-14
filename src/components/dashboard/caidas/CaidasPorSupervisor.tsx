'use client';

import { motion } from 'framer-motion';
import { Trophy, UserRound } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import type { DimensionAnalysis } from '@/services/analytics/falls';
import { CaidasCard } from './CaidasCard';

const MEDALS = ['🥇', '🥈', '🥉'];

export function CaidasPorSupervisor({ data }: { data: DimensionAnalysis[] }) {
  const rows = [...data]
    .filter((d) => d.caidas > 0)
    .sort((a, b) => b.caidas - a.caidas)
    .slice(0, 12);

  return (
    <CaidasCard
      icon={Trophy}
      title="Caídas por supervisor"
      subtitle="Leaderboard de supervisores con mayores caídas"
    >
      {rows.length === 0 ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 text-ink-soft">
          <UserRound className="size-5 text-ink-muted" />
          <p className="text-sm font-medium">No hay caídas por supervisor.</p>
        </div>
      ) : (
        <motion.ol
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          className="space-y-2"
        >
          {rows.map((row, i) => {
            const isTop = i < 3;
            const isWorst = i === 0;
            return (
              <motion.li
                key={row.name}
                variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-300',
                  isWorst
                    ? 'border-rose-500/30 bg-gradient-to-r from-rose-500/12 to-transparent shadow-[0_0_24px_-6px_rgba(244,63,94,0.4)]'
                    : 'border-line bg-surface/40 hover:bg-surface-3',
                )}
              >
                <span className="flex w-8 shrink-0 justify-center">
                  {isTop ? <span className={cn('text-base leading-none', isWorst && 'animate-pulse-glow')}>{MEDALS[i]}</span> : (
                    <span className="rounded-lg bg-white/5 px-1.5 py-0.5 text-xs font-bold text-ink-soft tabular-nums">
                      {i + 1}
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-ink" title={row.name}>{row.name}</span>
                    {isWorst && (
                      <span className="rounded-full bg-rose-500/15 px-2 py-px text-[9px] font-bold tracking-wide text-rose-300 uppercase">
                        Mayor caída
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-px text-[10px] font-semibold text-emerald-400">
                      Aprobados: {formatNumber(row.aprobados)}
                    </span>
                    <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-px text-[10px] font-semibold text-amber-400">
                      Pendientes: {formatNumber(row.pendientes)}
                    </span>
                  </div>
                </div>

                <div className="w-20 shrink-0 text-right">
                  <p className="text-lg font-bold text-rose-400 tabular-nums" style={{ textShadow: '0 0 14px rgba(244,63,94,0.5)' }}>
                    {formatNumber(row.caidas)}
                  </p>
                  <p className="text-[10px] font-semibold text-ink-soft tabular-nums">{row.pctCaida.toFixed(1)}% de caída</p>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      )}
    </CaidasCard>
  );
}