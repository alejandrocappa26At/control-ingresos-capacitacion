'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ChartEmpty } from '@/components/charts/charts';
import { formatNumber } from '@/lib/utils';

interface RankColor {
  from: string;
  to: string;
  soft: string;
  text: string;
}

const RANK_COLORS: RankColor[] = [
  { from: '#3b82f6', to: '#1e40af', soft: 'rgba(59,130,246,0.14)', text: '#3b82f6' },
  { from: '#8b5cf6', to: '#6d28d9', soft: 'rgba(139,92,246,0.14)', text: '#8b5cf6' },
  { from: '#10b981', to: '#065f46', soft: 'rgba(16,185,129,0.14)', text: '#10b981' },
];

const GRAY_COLOR: RankColor = {
  from: '#94a3b8',
  to: '#475569',
  soft: 'rgba(148,163,184,0.12)',
  text: '#64748b',
};

const MEDALS = ['🥇', '🥈', '🥉'];

export function SedeRanking({
  data,
  onSelect,
}: {
  data: Array<{ name: string; value: number }>;
  onSelect?: (sede: string) => void;
}) {
  const rows = data
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  if (!rows.length) return <ChartEmpty />;

  const total = rows.reduce((acc, d) => acc + d.value, 0);
  const max = Math.max(...rows.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-1">
      {rows.map((d, i) => {
        const color = RANK_COLORS[i] ?? GRAY_COLOR;
        const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
        const width = Math.max(i === 0 ? 100 : 7, (d.value / max) * 100);
        const rank = i + 1;

        return (
          <motion.div
            key={d.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="group relative w-full rounded-xl px-2 py-2 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-surface-3/70 hover:brightness-105 hover:shadow-[0_6px_18px_-8px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
            onClick={onSelect ? () => onSelect(d.name) : undefined}
            onKeyDown={
              onSelect
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(d.name);
                    }
                  }
                : undefined
            }
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
            aria-label={onSelect ? `Ver detalle de ${d.name}` : undefined}
          >
            <div className="flex items-center gap-3">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-base"
                style={{ background: color.soft, boxShadow: `inset 0 0 0 1px ${color.soft}` }}
              >
                {i < 3 ? (
                  <span className="drop-shadow-sm">{MEDALS[i]}</span>
                ) : (
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: color.text }}>
                    {rank}
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-ink">
                    {d.name}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-ink tabular-nums">
                    {formatNumber(d.value)}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.7, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
                        boxShadow: `0 1px 8px -1px ${color.from}99`,
                      }}
                    />
                  </div>
                  <span className="w-11 shrink-0 text-right text-[11px] font-bold text-ink-soft tabular-nums">
                    {pct}%
                  </span>
                </div>
              </div>

              {onSelect && (
                <ChevronRight className="size-4 shrink-0 text-ink-soft transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink" />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}