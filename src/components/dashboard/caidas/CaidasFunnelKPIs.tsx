'use client';

import type { EChartsOption } from 'echarts';
import { Workflow } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { ChartCard } from '@/components/charts/ChartCard';
import { QiEChart, tipHeader, tipRow } from '@/components/charts/EChart';
import type { EmbudoCapacitacion } from '@/services/analytics/falls';

const EMBUDO_COLORS: Array<{ name: string; fill: string; glow: string }> = [
  { name: 'Total de ingresos', fill: '#2563eb', glow: 'rgba(37,99,235,0.25)' },
  { name: 'Inician capacitación', fill: '#8b5cf6', glow: 'rgba(139,92,246,0.25)' },
  { name: 'Pasan a operaciones', fill: '#059669', glow: 'rgba(5,150,105,0.25)' },
];

function EmbudoCapacitacion({ embudo }: { embudo: EmbudoCapacitacion }) {
  const steps = [
    { name: 'Total de ingresos', value: embudo.totalIngresos, pct: 100 },
    { name: 'Inician capacitación', value: embudo.inicianCapacitacion, pct: embudo.inicianPct },
    { name: 'Pasan a operaciones', value: embudo.pasanOperaciones, pct: embudo.pasanPct },
  ].filter((s) => s.value > 0);

  const option: EChartsOption = {
    tooltip: {
      formatter: (params) => {
        const p = params as { name?: string; data?: { value: number; pct: number } };
        const color = EMBUDO_COLORS.find((c) => c.name === p.name)?.fill ?? '#a1a1aa';
        const value = p.data?.value ?? 0;
        const pct = p.data?.pct ?? 0;
        return (
          tipHeader(String(p.name ?? '—')) +
          tipRow(color, 'Registros', formatNumber(value)) +
          tipRow('#a1a1aa', '% del total de ingresos', `${pct.toFixed(1)}%`)
        );
      },
    },
    series: [
      {
        type: 'funnel',
        left: '8%',
        right: '8%',
        top: 8,
        bottom: 8,
        sort: 'none',
        gap: 4,
        minSize: '20%',
        maxSize: '100%',
        label: {
          show: true,
          position: 'inside',
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 800,
          formatter: (p) => {
            const d = p.data as { name: string; value: number; pct: number };
            return `${d.name}\n${formatNumber(d.value)} · ${d.pct.toFixed(1)}%`;
          },
        },
        labelLine: { show: false },
        itemStyle: { borderColor: '#ffffff', borderWidth: 2, borderRadius: 10, opacity: 0.96 },
        emphasis: { itemStyle: { shadowBlur: 18 } },
        animationDuration: 800,
        animationEasing: 'cubicOut',
        data: steps.map((s) => ({
          name: s.name,
          value: s.value,
          pct: s.pct,
          itemStyle: { color: EMBUDO_COLORS.find((c) => c.name === s.name)?.fill, shadowColor: EMBUDO_COLORS.find((c) => c.name === s.name)?.glow, shadowBlur: 10 },
        })),
      },
    ],
  };

  return (
    <ChartCard
      title="Embudo de Capacitación"
      description="Flujo principal: ingresan → inician → pasan a operaciones"
      icon={<Workflow className="size-4" />}
    >
      <QiEChart option={option} height={280} />
      <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-medium text-ink-soft">
        <span>
          Conversión total: <span className="font-bold text-emerald-400">{embudo.pasanPct.toFixed(1)}%</span>
        </span>
        <span>
          En capacitación: <span className="font-bold text-ink">{formatNumber(embudo.enCapacitacion)}</span> (
          {embudo.enCapacitacionPct.toFixed(1)}%)
        </span>
      </p>
    </ChartCard>
  );
}

export function CaidasFunnelKPIs({ embudo }: { embudo: EmbudoCapacitacion }) {
  return (
    <div className="space-y-4">
      <EmbudoCapacitacion embudo={embudo} />

      <p className="text-center text-[11px] font-semibold tracking-wide text-ink-soft">
        Flujo del proceso: ingresan → inician capacitación → pasan a operaciones
      </p>
    </div>
  );
}