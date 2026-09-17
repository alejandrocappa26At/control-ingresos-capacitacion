'use client';

import type { EChartsOption } from 'echarts';
import { Percent } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { ChartCard } from '@/components/charts/ChartCard';
import { QiEChart, tipHeader, tipRow } from '@/components/charts/EChart';
import { SEMAFORO_STYLES } from '@/services/analytics/reclutadores';
import { ZONA_SEMAFORO_RANGOS } from '@/services/analytics/zonas';
import type { ZonaDesercion } from '@/services/analytics/zonas';

function hexA(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TasaDesercionPorZona({ data }: { data: ZonaDesercion[] }) {
  const rows = [...data].filter((z) => z.deserciones > 0).slice(0, 12);
  const max = Math.max(...rows.map((z) => z.tasaDesercion), 0.1);
  const criticas = data.filter((z) => z.nivel === 'critico' && z.deserciones > 0).length;

  if (rows.length === 0) {
    return (
      <ChartCard
        title="📊 TASA DE DESERCIÓN POR ZONA COMERCIAL"
        description="Deserciones ÷ Ingresos de la zona × 100"
        icon={<Percent className="size-4" />}
      >
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 text-ink-soft">
          <Percent className="size-5 text-ink-muted" />
          <p className="text-sm font-medium">No hay deserciones por zona.</p>
        </div>
      </ChartCard>
    );
  }

  const option: EChartsOption = {
    grid: { containLabel: true, top: 4, left: 8, right: 68, bottom: 2 },
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
        html += tipRow(SEMAFORO_STYLES[d.nivel].color, 'Estado', `${SEMAFORO_STYLES[d.nivel].emoji} ${ZONA_SEMAFORO_RANGOS.find((r) => r.nivel === d.nivel)?.label ?? SEMAFORO_STYLES[d.nivel].label}`);
        return html;
      },
    },
    xAxis: { type: 'value', show: false, max: max * 1.18 },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((z) => z.zona),
      axisLabel: {
        color: '#e4e4e7',
        fontSize: 12,
        fontWeight: 700,
        margin: 10,
        formatter: (name: string, idx: number) => `${SEMAFORO_STYLES[rows[idx]?.nivel ?? 'bueno'].emoji} ${name}`,
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: 16,
        data: rows.map((z) => ({
          ...z,
          value: z.tasaDesercion,
          itemStyle: {
            color: SEMAFORO_STYLES[z.nivel].color,
            shadowColor: hexA(SEMAFORO_STYLES[z.nivel].color, 0.55),
            shadowBlur: 14,
          },
        })),
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
        },
        emphasis: {
          itemStyle: {
            shadowColor: 'rgba(255,255,255,0.35)',
            shadowBlur: 20,
          },
        },
        label: {
          show: true,
          position: 'right',
          color: '#f4f4f5',
          fontSize: 11,
          fontWeight: 700,
          formatter: (p) => `${(p.data as ZonaDesercion).tasaDesercion.toFixed(1)}%`,
        },
        animationDelay: (idx: number) => 60 + idx * 70,
        animationDuration: 700,
        animationEasing: 'cubicOut',
      },
    ],
  };

  return (
    <ChartCard
      title="📊 TASA DE DESERCIÓN POR ZONA COMERCIAL"
      description={`Deserciones ÷ Ingresos de la zona × 100 · ${criticas > 0 ? `${criticas} en nivel crítico` : 'sin niveles críticos'}`}
      icon={<Percent className="size-4" />}
    >
      <QiEChart option={option} height={Math.max(240, rows.length * 40 + 16)} />

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ZONA_SEMAFORO_RANGOS.map((r) => (
          <div key={r.nivel} className={cn('flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5')}>
            <span className="text-xs leading-none">{r.emoji}</span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold text-ink tabular-nums">
                {r.max === Infinity ? '9%+' : `${r.max === 3 ? '0' : r.max - 3}-${r.max}%`}
              </p>
              <p className="text-[9px] font-semibold tracking-wide text-ink-soft uppercase">{r.label}</p>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}