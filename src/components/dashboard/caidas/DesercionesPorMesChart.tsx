'use client';

import type { EChartsOption } from 'echarts';
import { BarChartHorizontal, CheckCircle2, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatNumber } from '@/lib/utils';
import { ChartCard } from '@/components/charts/ChartCard';
import { QiEChart, tipHeader, tipRow, qiHGradient } from '@/components/charts/EChart';
import type { MesRanking } from '@/services/analytics/desercion';

const MEDALS = ['🥇', '🥈', '🥉'];

interface RankingDatum extends MesRanking {
  intensity: number;
}

export function DesercionesPorMesChart({ data }: { data: MesRanking[] }) {
  const rows = [...data].sort((a, b) => b.value - a.value);
  const max = rows.reduce((acc, r) => Math.max(acc, r.value), 0);
  const top = rows[0];

  if (rows.length === 0) {
    return (
      <ChartCard title="Deserciones por mes" description="Ranking de mayor a menor" icon={<BarChartHorizontal className="size-4" />}>
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-64 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.09] via-emerald-500/[0.03] to-transparent px-6 text-center shadow-[0_16px_48px_-20px_rgba(16,185,129,0.4)]"
        >
          <div className="pointer-events-none absolute -top-20 left-1/2 size-48 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 15 }}
            className="flex size-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 shadow-[0_0_36px_rgba(16,185,129,0.35)]"
          >
            <CheckCircle2 className="size-8 text-emerald-300" />
          </motion.div>

          <div>
            <p className="text-base font-black tracking-[0.22em] text-emerald-300 uppercase drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]">
              Sin deserciones
            </p>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-ink-soft">
              No se registraron deserciones durante el periodo.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-1 flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <Percent className="size-4 text-emerald-300" />
            Tasa de deserción: 0%
          </motion.div>
        </motion.div>
      </ChartCard>
    );
  }

  const option: EChartsOption = {
    grid: { containLabel: true, top: 4, left: 8, right: 64, bottom: 2 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.04)' } },
      formatter: (ps) => {
        const params = (Array.isArray(ps) ? ps : [ps]) as Array<{ data?: RankingDatum; name?: string }>;
        const row = params[0]?.data;
        if (!row) return '';
        const idx = rows.findIndex((r) => r.name === row.name);
        const medal = idx >= 0 && idx < 3 ? `${MEDALS[idx]} ` : `#${idx + 1} `;
        let html = tipHeader(`${medal}${row.name}`);
        html += tipRow('#e30613', 'Deserciones', formatNumber(row.value));
        html += tipRow('#f43f5e', '% del total de deserciones', `${row.porcentaje.toFixed(1)}%`);
        html += tipRow('#a1a1aa', 'Tasa del mes', `${row.tasa.toFixed(1)}%`);
        html += tipRow('#ff2735', 'Intensidad', `${Math.round(row.intensity * 100)}%`);
        return html;
      },
    },
    xAxis: { type: 'value', show: false, max: (max ?? 1) * 1.12 },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((r) => r.name),
      axisLabel: {
        color: '#e4e4e7',
        fontSize: 12,
        fontWeight: 700,
        margin: 10,
        formatter: (name: string, idx: number) => (idx < 3 ? `${MEDALS[idx]} ${name}` : name),
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: 16,
        data: rows.map((r) => ({
          ...r,
          intensity: max > 0 ? r.value / max : 0,
        })),
        itemStyle: {
          color: qiHGradient('#7a030a', '#e30613'),
          borderRadius: [0, 8, 8, 0],
          shadowColor: 'rgba(227,6,19,0.4)',
          shadowBlur: 12,
        },
        emphasis: { itemStyle: { shadowColor: 'rgba(227,6,19,0.8)', shadowBlur: 20 } },
        label: {
          show: true,
          position: 'right',
          color: '#f4f4f5',
          fontSize: 11,
          fontWeight: 700,
          formatter: (p) => {
            const d = p.data as RankingDatum;
            return `${formatNumber(p.value as number)} · ${d.porcentaje.toFixed(1)}%`;
          },
        },
        animationDelay: (idx: number) => 60 + idx * 70,
        animationDuration: 700,
        animationEasing: 'cubicOut',
      },
    ],
  };

  return (
    <ChartCard
      title="Deserciones por mes"
      description="Ranking de mayor a menor · podio premium"
      icon={<BarChartHorizontal className="size-4" />}
    >
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/[0.14] via-rose-900/[0.08] to-transparent p-4 shadow-[0_10px_36px_-14px_rgba(227,6,19,0.55)]">
        <div className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-rose-500/25 blur-3xl" />
        <p className="relative text-[10px] font-black tracking-widest text-rose-300 uppercase">🔥 Mes más crítico</p>
        <div className="relative mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <p className="text-2xl font-black tracking-tight text-ink">{top.name}</p>
          <div className="flex items-center gap-5">
            <div>
              <p className="text-[10px] font-bold tracking-wide text-ink-soft uppercase">Deserciones</p>
              <p className="text-xl font-black tabular-nums text-rose-300">{formatNumber(top.value)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wide text-ink-soft uppercase">% del total</p>
              <p className="text-xl font-black tabular-nums text-ink">{top.porcentaje.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      <QiEChart option={option} height={Math.max(240, rows.length * 40 + 16)} />

      <p className="mt-2 flex items-center gap-2 text-[11px] font-medium text-ink-soft">
        <span className="text-sm leading-none">{MEDALS.join(' ')}</span>
        top 3 meses con más deserciones · pasá el cursor sobre las barras
      </p>
    </ChartCard>
  );
}