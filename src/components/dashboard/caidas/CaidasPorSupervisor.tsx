'use client';

import type { EChartsOption } from 'echarts';
import { Trophy } from 'lucide-react';
import type { DimensionAnalysis } from '@/services/analytics/falls';
import { cn, formatNumber } from '@/lib/utils';
import { CaidasCard } from './CaidasCard';
import { QiEChart, tipHeader, tipRow } from '@/components/charts/EChart';

const MEDALS = ['🥇', '🥈', '🥉'];

interface SupervisorDatum extends DimensionAnalysis {
  rank: number;
}

export function CaidasPorSupervisor({ data }: { data: DimensionAnalysis[] }) {
  const rows = [...data]
    .filter((d) => d.caidas > 0)
    .sort((a, b) => b.caidas - a.caidas)
    .slice(0, 12);
  const max = Math.max(...rows.map((d) => d.caidas), 1);

  if (rows.length === 0) {
    console.warn(`[Caídas por supervisor] Empty State. 0 supervisores con caídas registradas.`);
    return (
      <CaidasCard icon={Trophy} title="Caídas por supervisor" subtitle="Leaderboard de supervisores con mayores caídas">
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 text-ink-soft">
          <Trophy className="size-5 text-ink-muted" />
          <p className="text-sm font-medium">No hay caídas por supervisor.</p>
        </div>
      </CaidasCard>
    );
  }

  const gradientTop = (i: number) => {
    if (i === 0) return { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#ff2735' }, { offset: 1, color: '#e30613' }] };
    if (i === 1) return { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#e30613' }, { offset: 1, color: '#b01220' }] };
    if (i === 2) return { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#a5111f' }, { offset: 1, color: '#7a030a' }] };
    return { type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#7a030a' }, { offset: 1, color: '#e30613' }] };
  };

  const option: EChartsOption = {
    grid: { containLabel: true, top: 4, left: 8, right: 72, bottom: 2 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.04)' } },
      formatter: (ps) => {
        const params = (Array.isArray(ps) ? ps : [ps]) as Array<{ data?: SupervisorDatum }>;
        const d = params[0]?.data;
        if (!d) return '';
        const medal = d.rank < 3 ? `${MEDALS[d.rank]} ` : `#${d.rank + 1} `;
        let html = tipHeader(`${medal}${d.name}`);
        html += tipRow('#e30613', 'Caídas', formatNumber(d.caidas));
        html += tipRow('#10b981', 'Aprobados', formatNumber(d.aprobados));
        html += tipRow('#f59e0b', 'Pendientes', formatNumber(d.pendientes));
        html += tipRow('#a1a1aa', 'Total de ingresos', formatNumber(d.total));
        html += tipRow('#f43f5e', 'Tasa de caída', `${d.pctCaida.toFixed(1)}%`);
        html += tipRow('#ff8b8f', '% del total de caídas', `${d.pctDelTotal.toFixed(1)}%`);
        return html;
      },
    },
    xAxis: { type: 'value', show: false, max: max * 1.1 },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((d) => d.name),
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
        data: rows.map((d, i) => ({ ...d, value: d.caidas, rank: i, itemStyle: { color: gradientTop(i) } })),
        itemStyle: {
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
            const d = p.data as { caidas: number; pctCaida: number; rank: number };
            return `${formatNumber(d.caidas)} · ${d.pctCaida.toFixed(1)}% ${d.rank === 0 ? '· MAYOR CAÍDA' : ''}`;
          },
        },
        animationDelay: (idx: number) => 60 + idx * 70,
        animationDuration: 700,
        animationEasing: 'cubicOut',
      },
    ],
  };

  return (
    <CaidasCard
      icon={Trophy}
      title="Caídas por supervisor"
      subtitle="Leaderboard de supervisores con mayores caídas"
    >
      <QiEChart option={option} height={Math.max(220, rows.length * 40 + 12)} />
      <p className={cn('mt-2 text-[11px] font-medium text-ink-soft')}>
        <span className="mr-1 text-sm leading-none">{MEDALS.join(' ')}</span>
        top 3 · pasá el cursor sobre las barras para ver aprobados y pendientes.
      </p>
    </CaidasCard>
  );
}