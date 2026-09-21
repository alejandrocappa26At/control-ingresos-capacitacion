'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Percent, Trophy, Users } from 'lucide-react';
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
}: {
  data: Array<{ name: string; value: number }>;
}) {
  const rows = data
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  if (!rows.length) return <ChartEmpty />;

  const total = rows.reduce((acc, d) => acc + d.value, 0);
  const max = Math.max(...rows.map((d) => d.value), 1);

  return (
    <div className="relative z-10 flex flex-col gap-1">
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
            className="group relative rounded-xl px-2 py-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-surface-3/70 hover:shadow-[0_6px_18px_-8px_rgba(0,0,0,0.25)]"
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
                  <span className="truncate text-sm font-semibold text-ink" title={d.name}>
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
            </div>

            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 scale-95 opacity-0 transition-all duration-200 ease-out group-hover:scale-100 group-hover:opacity-100">
              <div className="relative w-48 rounded-xl border border-line bg-white p-3 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.35),0_6px_16px_-8px_rgba(0,0,0,0.2)]">
                <div className="absolute -left-1 top-1/2 size-2 -translate-y-1/2 rotate-45 border-b border-l border-line bg-white" />
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                  <Trophy className="size-3.5" style={{ color: color.text }} />
                  Top {rank}
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div className="col-span-2">
                    <p className="flex items-center gap-1 text-[10px] text-ink-soft">
                      <MapPin className="size-3" />
                      Sede
                    </p>
                    <p className="truncate text-sm font-bold text-ink" title={d.name}>
                      {d.name}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-[10px] text-ink-soft">
                      <Users className="size-3" />
                      Ingresos
                    </p>
                    <p className="text-sm font-bold text-ink tabular-nums">{formatNumber(d.value)}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-[10px] text-ink-soft">
                      <Percent className="size-3" />
                      Porcentaje
                    </p>
                    <p className="text-sm font-bold tabular-nums" style={{ color: color.text }}>
                      {pct}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}