'use client';

import type { EChartsOption } from 'echarts';
import type { ReactNode } from 'react';
import { TrendingDown } from 'lucide-react';
import { QiEChart, tipHeader, tipRow } from '@/components/charts/EChart';
import type { CaidaRanking } from '@/types';
import { cn, formatNumber } from '@/lib/utils';

interface MotivoChartProps {
  data: CaidaRanking[];
  tone: 'danger' | 'warning';
  height?: number;
}

function MotivoChart({ data, tone, height }: MotivoChartProps) {
  const rows = [...data].sort((a, b) => b.cantidad - a.cantidad).slice(0, 14);
  const max = Math.max(...rows.map((r) => r.cantidad), 1);
  const accent = tone === 'danger' ? '#e30613' : '#f59e0b';
  const [from, mid, to] =
    tone === 'danger' ? ['#7a030a', '#e30613', '#ff2735'] : ['#78350f', '#f59e0b', '#fbbf24'];

  const option: EChartsOption = {
    grid: { containLabel: true, top: 4, left: 8, right: 84, bottom: 2 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.04)' } },
      formatter: (ps) => {
        const params = (Array.isArray(ps) ? ps : [ps]) as Array<{ data?: CaidaRanking }>;
        const d = params[0]?.data;
        if (!d) return '';
        let html = tipHeader(d.motivo);
        html += tipRow(accent, 'Cantidad de caídas', formatNumber(d.cantidad));
        html += tipRow('#a1a1aa', '% del total de caídas', `${d.porcentaje.toFixed(1)}%`);
        return html;
      },
    },
    xAxis: { type: 'value', show: false, max: max * 1.1 },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((r) => r.motivo),
      axisLabel: { color: '#e4e4e7', fontSize: 12, fontWeight: 700, margin: 10 },
    },
    series: [
      {
        type: 'bar',
        barWidth: 14,
        data: rows.map((r) => ({ ...r, value: r.cantidad })),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: from },
              { offset: 0.6, color: mid },
              { offset: 1, color: to },
            ],
          },
          borderRadius: [0, 8, 8, 0],
          shadowColor: accent,
          shadowBlur: 12,
        },
        emphasis: { itemStyle: { shadowColor: accent, shadowBlur: 20 } },
        label: {
          show: true,
          position: 'right',
          color: '#f4f4f5',
          fontSize: 11,
          fontWeight: 700,
          formatter: (p) => {
            const d = p.data as CaidaRanking;
            return `${formatNumber(d.cantidad)} · ${d.porcentaje.toFixed(1)}%`;
          },
        },
        animationDelay: (idx: number) => 60 + idx * 70,
        animationDuration: 700,
        animationEasing: 'cubicOut',
      },
    ],
  };

  return <QiEChart option={option} height={height ?? Math.max(180, rows.length * 38 + 12)} />;
}

export function CaidasRanking({ motivo, subMotivo, total }: { motivo: CaidaRanking[]; subMotivo: CaidaRanking[]; total: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RankingCard title="Ranking por motivo de caída" subtitle={`${formatNumber(total)} caídas analizadas`}>
        <MotivoChart data={motivo} tone="danger" />
      </RankingCard>
      <RankingCard title="Ranking por submotivo de caída" subtitle={`${formatNumber(total)} caídas analizadas`}>
        <MotivoChart data={subMotivo} tone="warning" />
      </RankingCard>
    </div>
  );
}

function RankingCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow">
      <div className="mb-3 flex items-center gap-2">
        <span className={cn('flex size-8 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]', 'from-rose-500/25 to-rose-500/5 text-rose-400')}>
          <TrendingDown className="size-4" />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">{title}</p>
          <p className="text-xs text-ink-soft">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}