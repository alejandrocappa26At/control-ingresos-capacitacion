'use client';

import type { EChartsOption } from 'echarts';
import { BarChartHorizontal } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { ChartCard } from '@/components/charts/ChartCard';
import { QiEChart, tipHeader, tipRow, qiHGradient } from '@/components/charts/EChart';
import type { ResumenReclutador } from '@/services/analytics/reclutadores';

const MEDALS = ['🥇', '🥈', '🥉'];

export function ProductividadReclutadores({ data }: { data: ResumenReclutador[] }) {
  const rows = [...data].slice(0, 12);
  const max = Math.max(...rows.map((r) => r.ingresos), 1);
  const top = rows[0];

  if (rows.length === 0) {
    return (
      <ChartCard
        title="📊 PRODUCTIVIDAD DE RECLUTADORES"
        description="Cantidad de ingresos generados por responsable A&S"
        icon={<BarChartHorizontal className="size-4" />}
      >
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 text-ink-soft">
          <BarChartHorizontal className="size-5 text-ink-muted" />
          <p className="text-sm font-medium">No hay reclutadores con ingresos registrados.</p>
        </div>
      </ChartCard>
    );
  }

  const option: EChartsOption = {
    grid: { containLabel: true, top: 4, left: 8, right: 96, bottom: 2 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.04)' } },
      formatter: (ps) => {
        const params = (Array.isArray(ps) ? ps : [ps]) as Array<{ data?: ResumenReclutador }>;
        const d = params[0]?.data;
        if (!d) return '';
        let html = tipHeader(d.responsable);
        html += tipRow('#ff2735', 'Ingresos', formatNumber(d.ingresos));
        html += tipRow('#a1a1aa', 'Deserciones', formatNumber(d.deserciones));
        html += tipRow('#f59e0b', 'Bajas', formatNumber(d.bajas));
        html += tipRow('#10b981', 'Pasan a operaciones', formatNumber(d.pasanOperaciones));
        html += tipRow('#ff8b8f', '% del total', `${d.pctDelTotal.toFixed(1)}%`);
        return html;
      },
    },
    xAxis: { type: 'value', show: false, max: max * 1.15 },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((r) => r.responsable),
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
        data: rows.map((d) => ({ ...d, value: d.ingresos })),
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
            const d = p.data as ResumenReclutador;
            return `${formatNumber(d.ingresos)} · ${d.pctDelTotal.toFixed(1)}%`;
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
      title="📊 PRODUCTIVIDAD DE RECLUTADORES"
      description="Cantidad de ingresos generados · Responsable A&S · ordenado de mayor a menor"
      icon={<BarChartHorizontal className="size-4" />}
    >
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/[0.14] via-rose-900/[0.08] to-transparent p-4 shadow-[0_10px_36px_-14px_rgba(227,6,19,0.55)]">
        <div className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-rose-500/25 blur-3xl" />
        <p className="relative text-[10px] font-black tracking-widest text-rose-300 uppercase">🏆 Reclutador más productivo</p>
        <div className="relative mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <p className="truncate text-xl font-black tracking-tight text-ink">{MEDALS[0]} {top.responsable}</p>
          <div className="flex items-center gap-5">
            <div>
              <p className="text-[10px] font-bold tracking-wide text-ink-soft uppercase">Ingresos</p>
              <p className="text-xl font-black tabular-nums text-rose-300">{formatNumber(top.ingresos)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wide text-ink-soft uppercase">% del total</p>
              <p className="text-xl font-black tabular-nums text-ink">{top.pctDelTotal.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      <QiEChart option={option} height={Math.max(240, rows.length * 40 + 16)} />

      <p className="mt-2 flex items-center gap-2 text-[11px] font-medium text-ink-soft">
        <span className="text-sm leading-none">{MEDALS.join(' ')}</span>
        top 3 reclutadores · pasá el cursor sobre las barras para deserciones, bajas y pasan a operaciones
      </p>
    </ChartCard>
  );
}