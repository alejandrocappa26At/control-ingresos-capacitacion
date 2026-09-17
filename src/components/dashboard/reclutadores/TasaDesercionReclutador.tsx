'use client';

import type { EChartsOption } from 'echarts';
import { TrendingDown } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { ChartCard } from '@/components/charts/ChartCard';
import { QiEChart, tipHeader, tipRow } from '@/components/charts/EChart';
import { RANGOS_SEMAFORO, SEMAFORO_STYLES } from '@/services/analytics/reclutadores';
import type { ResumenReclutador } from '@/services/analytics/reclutadores';

function hexA(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TasaDesercionReclutador({ data }: { data: ResumenReclutador[] }) {
  const rows = [...data].slice(0, 12);
  const max = Math.max(...rows.map((r) => r.tasaDesercion), 0.1);
  const criticos = data.filter((r) => r.nivel === 'critico').length;
  const top = rows[0];

  if (rows.length === 0) {
    return (
      <ChartCard
        title="📉 TASA DE DESERCIÓN POR RECLUTADOR"
        description="Deserciones ÷ Ingresos × 100"
        icon={<TrendingDown className="size-4" />}
      >
        <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 text-ink-soft">
          <TrendingDown className="size-5 text-ink-muted" />
          <p className="text-sm font-medium">No hay reclutadores con ingresos registrados.</p>
        </div>
      </ChartCard>
    );
  }

  const option: EChartsOption = {
    grid: { containLabel: true, top: 4, left: 8, right: 72, bottom: 2 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.04)' } },
      formatter: (ps) => {
        const params = (Array.isArray(ps) ? ps : [ps]) as Array<{ data?: ResumenReclutador }>;
        const d = params[0]?.data;
        if (!d) return '';
        const style = SEMAFORO_STYLES[d.nivel];
        let html = tipHeader(d.responsable);
        html += tipRow('#ff2735', 'Ingresos', formatNumber(d.ingresos));
        html += tipRow('#e30613', 'Deserciones', formatNumber(d.deserciones));
        html += tipRow('#f4f4f5', '% de deserción', `${d.tasaDesercion.toFixed(1)}%`);
        html += tipRow(style.color, 'Nivel', `${style.emoji} ${style.label}`);
        html += tipRow('#ff8b8f', '% del total de deserciones', `${d.pctDeserciones.toFixed(1)}%`);
        return html;
      },
    },
    xAxis: { type: 'value', show: false, max: max * 1.18 },
    yAxis: {
      type: 'category',
      inverse: true,
      data: rows.map((r) => r.responsable),
      axisLabel: {
        color: '#e4e4e7',
        fontSize: 12,
        fontWeight: 700,
        margin: 10,
        formatter: (name: string, idx: number) => {
          const nivel = rows[idx]?.nivel ?? 'bueno';
          return `${SEMAFORO_STYLES[nivel].emoji} ${name}`;
        },
      },
    },
    series: [
      {
        type: 'bar',
        barWidth: 16,
        data: rows.map((r) => ({
          ...r,
          value: r.tasaDesercion,
          itemStyle: {
            color: SEMAFORO_STYLES[r.nivel].color,
            shadowColor: hexA(SEMAFORO_STYLES[r.nivel].color, 0.55),
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
          formatter: (p) => {
            const d = p.data as ResumenReclutador;
            return `${d.tasaDesercion.toFixed(1)}%`;
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
      title="📉 TASA DE DESERCIÓN POR RECLUTADOR"
      description={`Deserciones ÷ Ingresos × 100 · ${criticos > 0 ? `${criticos} en nivel crítico` : 'sin niveles críticos'}`}
      icon={<TrendingDown className="size-4" />}
    >
      <div className="relative mb-4 overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.12] via-amber-900/[0.07] to-transparent p-4 shadow-[0_10px_36px_-14px_rgba(245,158,11,0.4)]">
        <div className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full bg-amber-500/25 blur-3xl" />
        <p className="relative text-[10px] font-black tracking-widest text-amber-300 uppercase">⚠️ Mayor tasa del periodo</p>
        <div className="relative mt-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <p className="truncate text-xl font-black tracking-tight text-ink">{SEMAFORO_STYLES[top.nivel].emoji} {top.responsable}</p>
          <div className="flex items-center gap-5">
            <div>
              <p className="text-[10px] font-bold tracking-wide text-ink-soft uppercase">Deserciones</p>
              <p className="text-xl font-black tabular-nums text-rose-300">{formatNumber(top.deserciones)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-wide text-ink-soft uppercase">Tasa</p>
              <p className="text-xl font-black tabular-nums text-amber-300">{top.tasaDesercion.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      <QiEChart option={option} height={Math.max(240, rows.length * 40 + 16)} />

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {RANGOS_SEMAFORO.map((r) => (
          <div
            key={r.nivel}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5',
            )}
          >
            <span className="text-xs leading-none">{r.emoji}</span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold text-ink tabular-nums">
                {r.max === Infinity ? '9%+' : `0-${r.max}%`}
              </p>
              <p className="text-[9px] font-semibold tracking-wide text-ink-soft uppercase">{r.label}</p>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}