'use client';

import { motion } from 'framer-motion';
import { CalendarDays, MapPin } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { CaidaDimensionDia } from '@/services/analytics/falls';

const MEDALS = ['🥇', '🥈', '🥉'];

interface RankingDiaCaidaSedeProps {
  data: CaidaDimensionDia[];
  totalCaidas: number;
  subtitle?: string;
}

export function RankingDiaCaidaSede({ data, totalCaidas, subtitle }: RankingDiaCaidaSedeProps) {
  const rows = [...data]
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total || (b.diaPromedio ?? 0) - (a.diaPromedio ?? 0))
    .slice(0, 8);
  const max = Math.max(...rows.map((r) => r.total), 1);
  const pctDelTotal = (n: number) => (totalCaidas > 0 ? (n / totalCaidas) * 100 : 0);
  const top = rows[0];

  if (rows.length === 0) {
    return (
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-card">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_280px_at_18%_-14%,rgba(244,63,94,0.12),transparent_65%)]" />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 py-10 text-center text-ink-soft">
          <MapPin className="size-5 text-ink-muted" />
          <p className="text-sm font-medium">No hay sedes con día de caída registrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_280px_at_18%_-14%,rgba(244,63,94,0.08),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />

      <div className="relative mb-3 flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
          <MapPin className="size-4" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-bold tracking-wide text-ink uppercase">Caídas por sede</p>
          <p className="truncate text-xs text-ink-soft">Volumen · día promedio · % del total{subtitle ? ` · ${subtitle}` : ''}</p>
        </div>
      </div>

      {top && (
        <div className="relative mb-3 overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-rose-50/60 to-transparent p-3.5">
          <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-rose-500/15 blur-3xl" />
          <p className="relative text-[10px] font-black tracking-widest text-rose-600 uppercase">Sede con mayor impacto</p>
          <div className="relative mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <p className="truncate text-xl font-black tracking-tight text-ink">{MEDALS[0]} {top.name}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-rose-400/40 bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                Día {top.diaPromedio != null ? top.diaPromedio.toFixed(1) : '—'}
              </span>
              <span className="text-lg font-black tabular-nums text-rose-600">{formatNumber(top.total)}</span>
              <span className="text-[11px] font-bold text-ink-soft">{pctDelTotal(top.total).toFixed(1)}% del total</span>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex flex-1 flex-col justify-center gap-2.5">
        {rows.map((r, i) => {
          const pct = max > 0 ? (r.total / max) * 100 : 0;
          const rank = i < 3 ? `${MEDALS[i]} ` : `#${i + 1}`;
          return (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border border-line bg-surface-3/40 p-2.5 pr-3 transition-colors duration-200 hover:border-rose-400/30 hover:bg-rose-500/[0.06]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="w-9 shrink-0 text-center text-sm font-black tabular-nums text-ink-soft">{rank}</span>
                  <p className="truncate text-sm font-bold text-ink">{r.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                    <CalendarDays className="size-3 text-rose-600" />
                    Día {r.diaPromedio != null ? r.diaPromedio.toFixed(1) : '—'}
                  </span>
                  <span className="font-black tabular-nums text-rose-600">{formatNumber(r.total)}</span>
                  <span className="w-12 text-right text-[11px] font-bold tabular-nums text-ink-soft">
                    {pctDelTotal(r.total).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 3)}%` }}
                  transition={{ delay: 0.25 + i * 0.07, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="relative mt-3 text-center text-[11px] font-medium text-ink-soft">
        Volumen de caídas y día promedio · {formatNumber(totalCaidas)} caídas en el periodo
      </p>
    </div>
  );
}