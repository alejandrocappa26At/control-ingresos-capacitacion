'use client';

import { useMemo } from 'react';
import type { BarSeriesOption, EChartsOption } from 'echarts';
import { ChartEmpty } from '@/components/charts/charts';
import { QiEChart, qiVGradient, tipHeader, tipRow } from '@/components/charts/EChart';
import { MONTH_NAMES } from '@/services/analytics/desercion';
import type { IngresoMensual } from '@/services/analytics/charts';
import { formatNumber } from '@/lib/utils';

const LIMA = { from: '#2563eb', to: '#60a5fa', solid: '#3b82f6' };
const PROVINCIA = { from: '#7c3aed', to: '#a855f7', solid: '#8b5cf6' };

const MESES = MONTH_NAMES.map((m) => m.toUpperCase());

export function IngresosPorMes({ data, height = 380 }: { data: IngresoMensual[]; height?: number }) {
  const { hasData, totalLima, totalProvincia, totalAnio, maxMes } = useMemo(() => {
    const lima = data.reduce((acc, d) => acc + d.lima, 0);
    const provincia = data.reduce((acc, d) => acc + d.provincia, 0);
    return {
      hasData: lima + provincia > 0,
      totalLima: lima,
      totalProvincia: provincia,
      totalAnio: lima + provincia,
      maxMes: data.reduce((acc, d) => Math.max(acc, d.total), 0),
    };
  }, [data]);

  const option: EChartsOption = useMemo(() => {
    const build = (key: 'lima' | 'provincia', color: typeof LIMA): BarSeriesOption => ({
      name: key === 'lima' ? 'Lima' : 'Provincia',
      type: 'bar',
      cursor: 'pointer',
      barMaxWidth: 22,
      barGap: '18%',
      barCategoryGap: '30%',
      itemStyle: {
        borderRadius: [5, 5, 0, 0],
        color: qiVGradient(color.from, color.to, 1, 0.72),
        shadowColor: `${color.solid}59`,
        shadowBlur: 10,
        shadowOffsetY: 3,
      },
      emphasis: {
        itemStyle: { shadowColor: `${color.solid}99`, shadowBlur: 20 },
      },
      label: {
        show: true,
        position: 'top',
        color: '#cbd5e1',
        fontSize: 9,
        fontWeight: 700,
        formatter: (p) => {
          const v = Number((p as { value?: unknown }).value) || 0;
          return v > 0 ? formatNumber(v) : '';
        },
      },
      animationDelay: (idx: number) => idx * 55,
      animationDuration: 750,
      animationEasing: 'cubicOut',
      data: data.map((d) => d[key]),
    });

    return {
      grid: { containLabel: true, top: 46, left: 8, right: 16, bottom: 4 },
      legend: {
        data: ['Lima', 'Provincia'],
        top: 0,
        left: 0,
        itemGap: 20,
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#cbd5e1', fontSize: 11, fontWeight: 600 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(59,130,246,0.08)' } },
        formatter: (ps) => {
          const arr = Array.isArray(ps) ? ps : [ps];
          const first = arr[0] as { dataIndex?: number } | undefined;
          const row = data[first?.dataIndex ?? 0];
          if (!row) return '';
          const pct = totalAnio > 0 ? (row.total / totalAnio) * 100 : 0;
          return (
            tipHeader(MESES[row.mes - 1]) +
            tipRow(LIMA.solid, 'Lima', formatNumber(row.lima)) +
            tipRow(PROVINCIA.solid, 'Provincia', formatNumber(row.provincia)) +
            tipRow('#f8fafc', 'Total del mes', formatNumber(row.total)) +
            tipRow('#94a3b8', 'Participación del año', `${pct.toFixed(1)}%`)
          );
        },
      },
      xAxis: {
        type: 'category',
        data: MESES,
        axisLabel: { color: '#cbd5e1', fontSize: 10, fontWeight: 600, interval: 0, hideOverlap: true },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(55,65,81,0.9)', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      series: [build('lima', LIMA), build('provincia', PROVINCIA)],
    };
  }, [data, totalAnio]);

  if (!hasData) return <ChartEmpty />;

  return (
    <div>
      <QiEChart option={option} height={height} />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-2.5 text-[11px] text-ink-soft">
        <span>
          Lima: <span className="font-bold text-blue-400 tabular-nums">{formatNumber(totalLima)}</span>
          <span className="mx-1.5 text-ink-muted">·</span>
          Provincia:{' '}
          <span className="font-bold text-violet-400 tabular-nums">{formatNumber(totalProvincia)}</span>
        </span>
        <span>
          Total del año: <span className="font-bold text-ink tabular-nums">{formatNumber(totalAnio)}</span>
        </span>
        <span>
          Mes más alto: <span className="font-bold text-ink tabular-nums">{formatNumber(maxMes)}</span>
        </span>
      </div>
    </div>
  );
}
