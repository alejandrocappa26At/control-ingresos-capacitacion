'use client';

import type { EChartsOption } from 'echarts';
import { BarChartHorizontal } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { ChartCard } from '@/components/charts/ChartCard';
import { QiEChart, tipHeader, tipRow, qiHGradient } from '@/components/charts/EChart';
import { SEMAFORO_STYLES } from '@/services/analytics/reclutadores';
import type { ZonaDesercion } from '@/services/analytics/zonas';

const MEDALS = ['🥇', '🥈', '🥉'];

export function DesercionesPorZona({ data }: { data: ZonaDesercion[] }) {
  const rows = [...data].filter((z) => z.deserciones > 0).slice(0, 12);
  const max = Math.max(...rows.map((z) => z.deserciones), 1);

  if (rows.length === 0) {
    return (
      <ChartCard
        title="📉 DESERCIONES POR ZONA COMERCIAL"
        description="Cantidad de deserciones · ordenado de mayor a menor"
        icon={<BarChartHorizontal className="size-4" />}
      >
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 text-ink-soft">
          <BarChartHorizontal className="size-5 text-ink-muted" />
          <p className="text-sm font-medium">No hay deserciones por zona.</p>
        </div>
      </ChartCard>
    );
  }

  const option: EChartsOption = {
    grid: { containLabel: true, top: 4, left: 8, right: 92, bottom: 2 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.04)' } },
      formatter: (ps) => {
        const params = (Array.isArray(ps) ? ps : [ps]) as Array<{ data?: ZonaDesercion }>;
        const d = params[0]?.data;
        if (!d) return '';
        let html = tipHeader(`📍 ${d.zona}`);
        html += tipRow('#ff2735', 'Ingresos', formatNumber(d.ingresos));
        html += tipRow('#e30613', 'Deserciones', formatNumber(d.deserciones));
        html += tipRow('#f4f4f5', 'Tasa de deserción', `${d.tasaDesercion.toFixed(1)}%`);
        html += tipRow('#ff8b8f', 'Participación en el total', `${d.pctDelTotal.toFixed(1)}%`);
        html += tipRow(SEMAFORO_STYLES[d.nivel].color, 'Estado', `${SEMAFORO_STYLES[d.nivel].emoji} ${SEMAFORO_STYLES[d.nivel].label}`);
        return html;
      },
    },
    xAxis: { type: 'value', show: false, max: max * 1.15 },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((z) => z.zona),
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
        data: rows.map((z) => ({ ...z, value: z.deserciones })),
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
            const d = p.data as ZonaDesercion;
            return `${formatNumber(d.deserciones)} · ${d.pctDelTotal.toFixed(1)}%`;
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
      title="📉 DESERCIONES POR ZONA COMERCIAL"
      description="Cantidad de deserciones · ordenado de mayor a menor"
      icon={<BarChartHorizontal className="size-4" />}
    >
      <QiEChart option={option} height={Math.max(240, rows.length * 40 + 16)} />

      <p className="mt-2 flex items-center gap-2 text-[11px] font-medium text-ink-soft">
        <span className="text-sm leading-none">{MEDALS.join(' ')}</span>
        top 3 zonas con más deserciones · pasá el cursor sobre las barras para el detalle
      </p>
    </ChartCard>
  );
}