'use client';

import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export interface CaidasBarRow {
  name: string;
  value: number;
  pct: number;
  pctLabel?: string;
  sub?: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

const ACCENTS = {
  rose: { from: '#f43f5e', to: '#fb7185' },
  amber: { from: '#f59e0b', to: '#f97316' },
} as const;

export function CaidasHorizontal({
  rows,
  accent = 'rose',
  unit = '',
  emptyMessage = 'Sin datos para mostrar.',
}: {
  rows: CaidasBarRow[];
  accent?: keyof typeof ACCENTS;
  unit?: '' | '%';
  emptyMessage?: string;
}) {
  if (!rows.length) {
    return (
      <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 text-ink-soft">
        <BarChart3 className="size-5 text-ink-muted" />
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const max = Math.max(...rows.map((r) => r.value), 1);
  const c = ACCENTS[accent];
  const formatValue = (v: number) => (unit === '%' ? `${v.toFixed(1)}%` : formatNumber(v));

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
      className="flex flex-col gap-2.5"
    >
      {rows.map((row, i) => {
        const isTop = i < 3;
        const width = (row.value / max) * 100;
        return (
          <motion.div
            key={row.name}
            variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
            className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-200 hover:bg-white/[0.03]"
          >
            <span className="flex w-7 shrink-0 justify-center">
              {isTop ? <span className="text-sm leading-none">{MEDALS[i]}</span> : (
                <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] font-bold text-ink-soft tabular-nums">
                  {i + 1}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline gap-2">
                <span className="truncate text-sm font-semibold text-ink" title={row.name}>
                  {row.name}
                </span>
              </div>
              <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="relative h-full overflow-hidden rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${c.from}, ${c.to})`,
                    boxShadow: `0 0 14px rgba(244,63,94,0.5), inset 0 0 6px rgba(255,255,255,0.35)`,
                    transition: 'box-shadow 0.25s ease',
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
                </motion.div>
              </div>
            </div>
            <div className="w-28 shrink-0 text-right">
              <p className="text-sm font-bold text-ink tabular-nums">{formatValue(row.value)}</p>
              <p className="text-[11px] font-semibold text-ink-soft tabular-nums">
                {row.pct.toFixed(1)}%{row.pctLabel ? ` ${row.pctLabel}` : ''}
              </p>
              {row.sub && <p className="text-[10px] font-medium text-rose-400/80 tabular-nums">{row.sub}</p>}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}