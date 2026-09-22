'use client';

import { motion } from 'framer-motion';
import {
  CalendarX2,
  Clock3,
  Hourglass,
  TrendingDown,
  UserX,
  Users,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import type { DesercionAnalisis } from '@/services/analytics/desercion';

const AMBER_GRADIENT = 'linear-gradient(135deg,#fde047 0%,#f59e0b 55%,#ea580c 100%)';
const AMBER_GLOW = 'rgba(245,158,11,0.45)';

interface BajasRow {
  key: string;
  label: string;
  value: number;
  total: number;
  gradient: string;
  glow: string;
  chip: string;
  icon: typeof Clock3;
  note: string;
}

export function BajasCapacitacionPremium({ data }: { data: DesercionAnalisis }) {
  const rows: BajasRow[] = [
    {
      key: 'nunca',
      label: 'Nunca asistió',
      value: data.totalDeserciones,
      total: data.totalIngresos,
      gradient: 'linear-gradient(135deg,#fbbf24 0%,#f59e0b 55%,#d97706 100%)',
      glow: 'rgba(245,158,11,0.5)',
      chip: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
      icon: UserX,
      note: 'PASA=No · DÍAS 0 · aparte del total de bajas',
    },
    {
      key: 'd1_3',
      label: 'Día 1-3',
      value: data.bajasDia1_3,
      total: data.totalIngresos,
      gradient: 'linear-gradient(135deg,#fde047 0%,#f59e0b 55%,#ea580c 100%)',
      glow: 'rgba(245,158,11,0.45)',
      chip: 'border-orange-500/30 bg-orange-500/15 text-orange-400',
      icon: Clock3,
      note: 'abandonaron su 1er-3er día',
    },
    {
      key: 'd4_12',
      label: 'Día 4-12',
      value: data.bajasDia4_12,
      total: data.totalIngresos,
      gradient: 'linear-gradient(135deg,#fb923c 0%,#f97316 55%,#ea580c 100%)',
      glow: 'rgba(249,115,22,0.5)',
      chip: 'border-orange-600/30 bg-orange-600/15 text-orange-500',
      icon: Hourglass,
      note: 'abandonaron su 4º-12º día',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
      className="group relative"
    >
      <div
        className="relative h-full overflow-hidden rounded-3xl p-px transition-all duration-300 ease-out group-hover:-translate-y-1"
        style={{
          background: `linear-gradient(165deg,${AMBER_GLOW},rgba(255,255,255,0.06) 45%,${AMBER_GLOW})`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 22px 54px -26px ${AMBER_GLOW}`,
        }}
      >
        <div className="relative flex h-full flex-col rounded-[calc(1.5rem-1px)] bg-surface-2/80 p-5 backdrop-blur-xl">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
            style={{ background: AMBER_GRADIENT, boxShadow: `0 2px 16px ${AMBER_GLOW}` }}
          />

          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-amber-400 uppercase">
            <TrendingDown className="size-3" /> Bajas durante capacitación
          </p>

          <div className="relative mt-4 flex items-baseline gap-2.5">
            <span className="text-4xl font-black tracking-tight text-ink tabular-nums">
              <CountUp value={data.bajas} />
            </span>
            <span className="text-xl font-black text-amber-400 tabular-nums">
              <CountUp value={data.bajasPct} format="percent" />
            </span>
          </div>
          <p className="mt-1 text-[10px] font-bold text-ink-soft">
            del {formatNumber(data.totalIngresos)} ingresos del periodo
          </p>

          <div className="relative mt-5 flex flex-col gap-2.5">
            {rows.map((row, i) => {
              const pct = data.totalIngresos > 0 ? (row.value / data.totalIngresos) * 100 : 0;
              const share = data.bajas > 0 ? (row.value / data.bajas) * 100 : 0;
              return (
                <motion.div
                  key={row.key}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.2 + i * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-surface-3/50 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase', row.chip)}>
                      <row.icon className="size-3" />
                      {row.label}
                    </span>
                    <span className="text-sm font-black text-ink tabular-nums">
                      <CountUp value={row.value} /> · {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.08 }}
                      className="h-full rounded-full"
                      style={{ background: row.gradient, boxShadow: `0 0 12px ${row.glow}` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[9px] font-medium text-ink-soft">
                    {formatNumber(row.value)} personas · {share.toFixed(1)}% de las bajas · {row.note}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <div className="relative mt-3 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-surface-3/50 px-3.5 py-3">
            <span className="flex items-center gap-2 text-[10px] font-bold text-ink-soft">
              <Users className="size-3.5 text-ink-soft" /> Pasan a operaciones
            </span>
            <span className="text-sm font-black text-ink tabular-nums">
              <CountUp value={data.pasanOperaciones} /> · {data.pasanPct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
