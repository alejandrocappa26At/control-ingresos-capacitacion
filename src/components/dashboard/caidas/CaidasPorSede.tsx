'use client';

import type { EChartsOption } from 'echarts';
import { MapPin } from 'lucide-react';
import type { DimensionAnalysis } from '@/services/analytics/falls';
import { cn, formatNumber } from '@/lib/utils';
import { CaidasCard } from './CaidasCard';
import { QiEChart, tipHeader, tipRow, qiHGradient } from '@/components/charts/EChart';

const MEDALS = ['🥇', '🥈', '🥉'];

interface SedeDatum extends DimensionAnalysis {
  pctDelTotalLabel: string;
}

export function CaidasPorSede({ data }: { data: DimensionAnalysis[] }) {
  const total = data.reduce((acc, d) => acc + d.caidas, 0);
  const rows = [...data]
    .filter((d) => d.caidas > 0)
    .sort((a, b) => b.caidas - a.caidas)
    .slice(0, 12);
  const max = Math.max(...rows.map((d) => d.caidas), 1);
  const top = rows[0];

  if (rows.length === 0) {
    console.warn(`[Caídas por sede] Empty State. totalCaidas=${total}, 0 sedes con caídas. Ajusta los filtros para ver distribución por sede.`);
    return (
      <CaidasCard icon={MapPin} title="Caídas por sede" subtitle={`${formatNumber(total)} caídas en total`}>
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 text-ink-soft">
          <MapPin className="size-5 text-ink-muted" />
          <p className="text-sm font-medium">No hay caídas por sede.</p>
        </div>
      </CaidasCard>
    );
  }

  const option: EChartsOption = {
    grid: { containLabel: true, top: 4, left: 8, right: 72, bottom: 2 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.04)' } },
      formatter: (ps) => {
        const params = (Array.isArray(ps) ? ps : [ps]) as Array<{ data?: SedeDatum }>;
        const d = params[0]?.data;
        if (!d) return '';
        let html = tipHeader(d.name);
        html += tipRow('#e30613', 'Caídas', formatNumber(d.caidas));
        html += tipRow('#ff8b8f', '% del total de caídas', `${d.pctDelTotal.toFixed(1)}%`);
        html += tipRow('#a1a1aa', 'Ingresos de la sede', formatNumber(d.total));
        html += tipRow('#f43f5e', 'Tasa de caída', `${d.pctCaida.toFixed(1)}%`);
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
        data: rows.map((d) => ({ ...d, value: d.caidas, pctDelTotalLabel: `${d.pctDelTotal.toFixed(1)}%` })),
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
            const d = p.data as { caidas: number; pctDelTotal: number };
            return `${formatNumber(d.caidas)} · ${d.pctDelTotal.toFixed(1)}%`;
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
      icon={MapPin}
      title="Caídas por sede"
      subtitle={`${formatNumber(total)} caídas en total · ordenado de mayor a menor`}
    >
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/[0.12] via-rose-900/[0.06] to-transparent p-3.5 shadow-[0_10px_36px_-14px_rgba(227,6,19,0.45)]">
        <div className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-rose-500/20 blur-3xl" />
        <p className="relative text-[10px] font-black tracking-widest text-rose-300 uppercase">🔥 Sede más crítica</p>
        <div className="relative mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <p className="truncate text-xl font-black tracking-tight text-ink">{MEDALS[0]} {top.name}</p>
          <div className="flex items-center gap-4">
            <span className="text-lg font-black tabular-nums text-rose-300">{formatNumber(top.caidas)}</span>
            <span className="text-[11px] font-bold text-ink-soft">{top.pctDelTotal.toFixed(1)}% del total</span>
          </div>
        </div>
      </div>

      <QiEChart option={option} height={Math.max(220, rows.length * 40 + 12)} />

      <p className={cn('mt-2 text-[11px] font-medium text-ink-soft')}>
        <span className="mr-1 text-sm leading-none">{MEDALS.join(' ')}</span>
        top 3 sedes con más caídas · pasá el cursor sobre las barras para el detalle
      </p>
    </CaidasCard>
  );
}