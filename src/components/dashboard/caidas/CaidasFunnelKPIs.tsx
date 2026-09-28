'use client';

import type { EChartsOption } from 'echarts';
import { AlertTriangle, Flame, TrendingDown, Workflow } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { ChartCard } from '@/components/charts/ChartCard';
import { QiEChart, tipHeader, tipRow } from '@/components/charts/EChart';
import { KpiCard } from '@/components/dashboard/KpiCard';
import type { EmbudoCapacitacion } from '@/services/analytics/falls';
import type { Kpis } from '@/types';

const EMBUDO_COLORS: Array<{ name: string; fill: string; glow: string }> = [
  { name: 'Total de ingresos', fill: '#e30613', glow: 'rgba(227,6,19,0.35)' },
  { name: 'Inician capacitación', fill: '#ff5a66', glow: 'rgba(255,90,102,0.3)' },
  { name: 'Pasan a operaciones', fill: '#00d26a', glow: 'rgba(0,210,106,0.3)' },
];

const MES_POR_NOMBRE: Record<string, string> = {
  Enero: 'ENE',
  Febrero: 'FEB',
  Marzo: 'MAR',
  Abril: 'ABR',
  Mayo: 'MAY',
  Junio: 'JUN',
  Julio: 'JUL',
  Agosto: 'AGO',
  Septiembre: 'SEP',
  Octubre: 'OCT',
  Noviembre: 'NOV',
  Diciembre: 'DIC',
};

function mesCorto(mes: string): string {
  return MES_POR_NOMBRE[mes] ?? mes.slice(0, 3).toUpperCase();
}

function embudoOption(embudo: EmbudoCapacitacion): EChartsOption {
  const steps = [
    { name: 'Total de ingresos', value: embudo.totalIngresos, pct: 100 },
    { name: 'Inician capacitación', value: embudo.inicianCapacitacion, pct: embudo.inicianPct },
    { name: 'Pasan a operaciones', value: embudo.pasanOperaciones, pct: embudo.pasanPct },
  ].filter((s) => s.value > 0);

  return {
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
        itemStyle: { borderColor: '#0b0f17', borderWidth: 2, borderRadius: 10, opacity: 0.96 },
        emphasis: { itemStyle: { shadowBlur: 18 } },
        animationDuration: 800,
        animationEasing: 'cubicOut',
        data: steps.map((s) => ({
          name: s.name,
          value: s.value,
          pct: s.pct,
          itemStyle: {
            color: EMBUDO_COLORS.find((c) => c.name === s.name)?.fill,
            shadowColor: EMBUDO_COLORS.find((c) => c.name === s.name)?.glow,
            shadowBlur: 10,
          },
        })),
      },
    ],
  };
}

export function CaidasFunnelKPIs({
  embudo,
  kpis,
  mesMayor,
  desercionDiaCero,
}: {
  embudo: EmbudoCapacitacion;
  kpis: Kpis;
  mesMayor: { mes: string; cantidad: number; porcentaje: number } | null;
  /** Por definición toda la deserción ocurre con 0 días (nunca asistió). */
  desercionDiaCero: boolean;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_232px]">
      <div className="flex min-w-0 flex-col gap-4">
        <ChartCard
          title="Embudo de Capacitación"
          description="Flujo principal: ingresan → inician → pasan a operaciones"
          icon={<Workflow className="size-4" />}
        >
          <QiEChart option={embudoOption(embudo)} height={300} />
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-medium text-ink-soft">
            <span>
              Conversión total:{' '}
              <span className="font-bold text-emerald-400">{embudo.pasanPct.toFixed(1)}%</span>
            </span>
            <span>
              En capacitación: <span className="font-bold text-ink">{formatNumber(embudo.enCapacitacion)}</span> (
              {embudo.enCapacitacionPct.toFixed(1)}%)
            </span>
          </p>
        </ChartCard>

        <p className="text-center text-[11px] font-semibold tracking-wide text-ink-soft">
          Flujo del proceso: ingresan → inician capacitación → pasan a operaciones
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <KpiCard
          index={0}
          title="Tasa de Deserción"
          value={kpis.porcentajeDesercion}
          format="percent"
          icon={TrendingDown}
          tone="slate"
          subtitle={`${formatNumber(kpis.desercion)} de ${formatNumber(kpis.totalIngresos)} ingresos`}
        />
        <KpiCard
          index={1}
          title="Bajas Durante Capacitación"
          value={kpis.bajasCapacitacion}
          icon={AlertTriangle}
          tone="amber"
          subtitle={`${kpis.porcentajeBajas.toFixed(1)}% de los que iniciaron`}
        />
        <KpiCard
          index={2}
          title="Mes con Mayor Deserción"
          value={mesMayor ? mesCorto(mesMayor.mes) : '—'}
          icon={Flame}
          tone="rose"
          subtitle={
            mesMayor
              ? `${formatNumber(mesMayor.cantidad)} · ${mesMayor.porcentaje.toFixed(1)}% de las deserciones`
              : desercionDiaCero
                ? 'Sin deserciones registradas'
                : '—'
          }
        />
      </div>
    </div>
  );
}
