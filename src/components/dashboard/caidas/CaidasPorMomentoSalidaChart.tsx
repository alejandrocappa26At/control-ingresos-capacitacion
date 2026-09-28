'use client';

import { useMemo, useState } from 'react';
import type { BarSeriesOption, EChartsOption } from 'echarts';
import { CalendarClock, Flame } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { ChartCard } from '@/components/charts/ChartCard';
import { QiEChart, qiVTextGradient, tipHeader, tipRow } from '@/components/charts/EChart';
import { ChartEmpty } from '@/components/charts/charts';
import { caidasPorMomentoDetallado } from '@/services/analytics/falls';
import type { Promotor } from '@/types';
import {
  FiltroPeriodoCaida,
  PERIODO_CAIDA_INICIAL,
  filtrarPorPeriodo,
  type PeriodoCaidaState,
} from './FiltroPeriodoCaida';

/** Deserción: gris oscuro. */
const COLOR_DESERCION = '#374151';
/** Baja durante capacitación: naranja. */
const COLOR_BAJAS = '#f59e0b';

const SERIES = [
  { key: 'desercion', label: 'Deserción', color: COLOR_DESERCION },
  { key: 'bajas', label: 'Baja Capacitación', color: COLOR_BAJAS },
] as const;

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function CaidasPorMomentoSalidaChart({ records }: { records: Promotor[] }) {
  const [periodo, setPeriodo] = useState<PeriodoCaidaState>(PERIODO_CAIDA_INICIAL);

  // El filtro es independiente de los filtros globales: se aplica solo aquí.
  const scoped = useMemo(() => filtrarPorPeriodo(records, periodo), [records, periodo]);
  const data = useMemo(() => caidasPorMomentoDetallado(scoped), [scoped]);

  const totales = useMemo(
    () => ({
      caidas: data.reduce((s, d) => s + d.total, 0),
      desercion: data.reduce((s, d) => s + d.desercion, 0),
      bajas: data.reduce((s, d) => s + d.bajas, 0),
    }),
    [data],
  );

  const diaCritico = useMemo(() => {
    let best: (typeof data)[number] | null = null;
    for (const d of data) {
      if (d.bajas <= 0) continue;
      if (!best || d.bajas > best.bajas) best = d;
    }
    return best;
  }, [data]);

  const option: EChartsOption = useMemo(
    () => ({
      grid: { containLabel: true, top: 42, left: 8, right: 16, bottom: 8 },
      legend: {
        data: SERIES.map((s) => s.label),
        top: 0,
        left: 0,
        itemGap: 18,
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#94a3b8', fontSize: 11 },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.04)' } },
        formatter: (ps) => {
          const arr = Array.isArray(ps) ? ps : [ps];
          const first = arr[0] as { dataIndex?: number } | undefined;
          const row = data[first?.dataIndex ?? 0];
          if (!row) return '';
          return (
            tipHeader(`Momento · ${row.name}`) +
            tipRow(COLOR_DESERCION, 'Deserción', formatNumber(row.desercion)) +
            tipRow(COLOR_BAJAS, 'Baja Capacitación', formatNumber(row.bajas)) +
            tipRow('#e5e7eb', 'Total', formatNumber(row.total)) +
            tipRow('#94a3b8', 'Participación', `${row.porcentaje.toFixed(1)}%`)
          );
        },
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.name),
        axisLabel: {
          color: '#cbd5e1',
          fontSize: 10,
          fontWeight: 600,
          interval: 0,
          rotate: 0,
          hideOverlap: true,
          overflow: 'truncate',
          width: 74,
          formatter: (value: string) => (value === 'Nunca asistió' ? 'NUNCA' : value.toUpperCase()),
        },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        name: 'Promotores',
        nameTextStyle: { color: '#64748b', fontSize: 10, align: 'right' },
        splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      series: SERIES.map(
        (s): BarSeriesOption => ({
          name: s.label,
          type: 'bar',
          cursor: 'pointer',
          barMaxWidth: 22,
          barGap: '12%',
          barCategoryGap: '32%',
          itemStyle: {
            borderRadius: [5, 5, 0, 0],
            color: qiVTextGradient(s.color, 0.98, 0.45),
            shadowColor: withAlpha(s.color, 0.4),
            shadowBlur: 8,
            shadowOffsetY: 3,
          },
          emphasis: {
            focus: 'series',
            itemStyle: { shadowColor: withAlpha(s.color, 0.7), shadowBlur: 18 },
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
          animationDelay: (idx: number) => idx * 40,
          animationDuration: 700,
          animationEasing: 'cubicOut',
          data: data.map((d) => d[s.key]),
        }),
      ),
    }),
    [data],
  );

  return (
    <ChartCard
      title="¿En qué momento se produce la caída?"
      description="Deserción (nunca asistió) vs. baja durante capacitación, por día"
      icon={<CalendarClock className="size-4" />}
      toolbar={<FiltroPeriodoCaida value={periodo} onChange={setPeriodo} records={records} />}
    >
      {totales.caidas === 0 ? (
        <ChartEmpty />
      ) : (
        <>
          <QiEChart option={option} height={420} />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-2.5 py-1.5">
              <Flame className="size-3.5 text-amber-400" />
              <span className="text-[10px] font-black tracking-wider text-amber-500 uppercase">Día crítico</span>
              {diaCritico ? (
                <>
                  <span className="text-sm font-black text-ink">{diaCritico.name}</span>
                  <span className="text-sm font-black tabular-nums text-amber-500">
                    {formatNumber(diaCritico.bajas)}
                  </span>
                  <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-500">
                    {diaCritico.porcentaje.toFixed(1)}%
                  </span>
                </>
              ) : (
                <span className="text-sm font-black text-ink">Sin bajas por día</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold text-ink-muted">
              <span>
                Total de caídas: <b className="tabular-nums text-ink">{formatNumber(totales.caidas)}</b>
              </span>
              <span>
                <span
                  className="mr-1 inline-block size-2 rounded-sm align-middle"
                  style={{ background: COLOR_DESERCION }}
                />
                Deserción <b className="tabular-nums text-ink">{formatNumber(totales.desercion)}</b>
              </span>
              <span>
                <span
                  className="mr-1 inline-block size-2 rounded-sm align-middle"
                  style={{ background: COLOR_BAJAS }}
                />
                Bajas <b className="tabular-nums text-ink">{formatNumber(totales.bajas)}</b>
              </span>
            </div>
          </div>

          <p className="mt-2 text-[11px] leading-snug text-ink-soft">
            Analizando <b className="text-ink tabular-nums">{formatNumber(scoped.length)}</b> registros del período
            seleccionado (de {formatNumber(records.length)} tras los filtros globales). Toda la{' '}
            <b className="text-ink">deserción</b> ocurre con 0 días (nunca asistió), por lo que se concentra en la
            primera barra. Las <b className="text-ink">bajas</b> sí se reparten entre los días 1 y 12: ese tramo
            revela el día crítico de abandono.
          </p>
        </>
      )}
    </ChartCard>
  );
}
