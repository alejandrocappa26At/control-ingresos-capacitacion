'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, CheckCircle2, AlertCircle, UserX, MousePointerClick, type LucideIcon } from 'lucide-react';
import type { BarSeriesOption, EChartsOption } from 'echarts';
import type { CapacitadorSummary, Kpis } from '@/types';
import { useDataStore } from '@/store/useDataStore';
import { ChartCard } from '@/components/charts/ChartCard';
import { QiEChart, qiVTextGradient, tipHeader, tipRow } from '@/components/charts/EChart';
import { ChartEmpty } from '@/components/charts/charts';
import { CapacitadorMultiSelect } from '@/components/filters/CapacitadorMultiSelect';
import { CountUp } from '@/components/ui/count-up';
import { periodoLabel } from '@/lib/dates';
import { formatNumber } from '@/lib/utils';
import { PeriodoHeader, type PeriodoCifras } from './PeriodoHeader';

const SERIES = [
  { key: 'asignados', label: 'Total Ingresos', color: '#3b82f6' },
  { key: 'aprobados', label: 'Aprobados', color: '#10b981' },
  { key: 'bajasCapacitacion', label: 'Bajas durante Capacitación', color: '#f97316' },
  { key: 'desercion', label: 'Deserción', color: '#52525b' },
] as const;

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function tasaAprobacion(r: CapacitadorSummary): number {
  return r.finalizados > 0 ? (r.aprobados / r.finalizados) * 100 : 0;
}

function tasaCaida(r: CapacitadorSummary): number {
  return r.finalizados > 0 ? ((r.bajasCapacitacion + r.desercion) / r.finalizados) * 100 : 0;
}

function share(r: CapacitadorSummary, value: number): number {
  return r.finalizados > 0 ? (value / r.finalizados) * 100 : 0;
}

const MAX_AXIS_LABEL = 24;

function initialsOf(nombre: string): string {
  const tokens = nombre.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return '';
  if (tokens.length === 1) return tokens[0].toUpperCase();
  return `${tokens[0].toUpperCase()} ${tokens[tokens.length - 1].charAt(0).toUpperCase()}.`;
}

function recortar(texto: string, max = MAX_AXIS_LABEL): string {
  if (texto.length <= max) return texto;
  return `${texto.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Etiqueta corta y horizontal para el eje X.
 *   1 capacitador   -> "MARIA T."
 *   2 capacitadores -> "ALEJANDRO C. + SOFIA R."
 *   3 o más         -> "ALEJANDRO C. + SOFIA +1"
 * Si aun así no cabe, se trunca de forma elegante ("ALEJANDRO C. + SO…").
 */
export function etiquetaCapacitador(nombre: string): string {
  const partes = nombre
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);
  if (partes.length === 0) return '—';
  if (partes.length === 1) return recortar(initialsOf(partes[0]));
  const base = partes.slice(0, 2).map(initialsOf).join(' + ');
  const extra = partes.length - 2;
  return extra > 0 ? `${recortar(base, MAX_AXIS_LABEL - 3)} +${extra}` : recortar(base);
}

interface RendimientoCapacitadoresProps {
  data: CapacitadorSummary[];
  kpis: Kpis;
  onSelectCapacitador: (capacitador: string) => void;
}

export function RendimientoCapacitadores({ data, kpis, onSelectCapacitador }: RendimientoCapacitadoresProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const fechaIngreso = useDataStore((s) => s.filters.fechaIngreso);

  const periodo = useMemo(() => periodoLabel(fechaIngreso), [fechaIngreso]);

  const options = useMemo(() => data.map((c) => c.capacitador), [data]);

  const rows = useMemo(() => {
    if (selected.length === 0) return [...data].sort((a, b) => b.asignados - a.asignados);
    const set = new Set(selected);
    return data.filter((c) => set.has(c.capacitador)).sort((a, b) => b.asignados - a.asignados);
  }, [data, selected]);

  const globalCifras: PeriodoCifras = useMemo(
    () => ({
      ingresos: kpis.totalIngresos,
      aprobados: kpis.pasanAOperaciones,
      bajas: kpis.bajasCapacitacion,
      desercion: kpis.desercion,
    }),
    [kpis],
  );

  const seleccionCifras = useMemo(() => {
    if (selected.length === 0) return null;
    const total = rows.reduce(
      (acc, r) => ({
        ingresos: acc.ingresos + r.asignados,
        aprobados: acc.aprobados + r.aprobados,
        bajas: acc.bajas + r.bajasCapacitacion,
        desercion: acc.desercion + r.desercion,
      }),
      { ingresos: 0, aprobados: 0, bajas: 0, desercion: 0 },
    );
    const etiqueta =
      rows.length === 1
        ? rows[0].capacitador
        : `${rows.length} capacitadores · ${rows.map((r) => r.capacitador).join(', ')}`;
    return { ...total, etiqueta };
  }, [rows, selected.length]);

  const highlights = useMemo(() => {
    if (rows.length === 0) return null;
    const conFinalizados = rows.filter((r) => r.finalizados > 0);
    return {
      mejorAprobacion: conFinalizados.length
        ? conFinalizados.reduce((a, b) => (tasaAprobacion(b) > tasaAprobacion(a) ? b : a))
        : null,
      mayorDesercion: rows.reduce((a, b) => (b.desercion > a.desercion ? b : a)),
      mayorBaja: rows.reduce((a, b) => (b.bajasCapacitacion > a.bajasCapacitacion ? b : a)),
    };
  }, [rows]);

  const onChartClick = useCallback(
    (params: unknown) => {
      const p = params as { componentType?: string; dataIndex?: number; value?: unknown; name?: unknown };
      let key: string | undefined;

      if (p.componentType === 'xAxis' && typeof p.value === 'string') {
        key = rows.find((r) => r.capacitador === p.value)?.capacitador;
      } else {
        if (typeof p.name === 'string') key = rows.find((r) => r.capacitador === p.name)?.capacitador;
        if (!key && typeof p.dataIndex === 'number') key = rows[p.dataIndex]?.capacitador;
      }

      if (key) onSelectCapacitador(key);
    },
    [rows, onSelectCapacitador],
  );

  const chartEvents = useMemo(() => ({ click: onChartClick }), [onChartClick]);

  const option: EChartsOption = useMemo(() => {
    const opt: EChartsOption = {
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
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(59,130,246,0.08)' } },
        formatter: (ps) => {
          const arr = Array.isArray(ps) ? ps : [ps];
          const first = arr[0] as { dataIndex?: number } | undefined;
          const row = rows[first?.dataIndex ?? 0];
          if (!row) return '';
          return (
            tipHeader(row.capacitador) +
            tipRow('#3b82f6', 'Total ingresos', formatNumber(row.asignados)) +
            tipRow('#10b981', 'Aprobados', formatNumber(row.aprobados), `${tasaAprobacion(row).toFixed(1)}%`) +
            tipRow('#f97316', 'Bajas durante capacitación', formatNumber(row.bajasCapacitacion)) +
            tipRow('#52525b', 'Deserción', formatNumber(row.desercion), `${tasaCaida(row).toFixed(1)}%`)
          );
        },
      },
      xAxis: {
        type: 'category',
        triggerEvent: true,
        data: rows.map((r) => r.capacitador),
        axisLabel: {
          color: '#cbd5e1',
          fontSize: 11,
          fontWeight: 600,
          interval: 0,
          rotate: 0,
          hideOverlap: true,
          overflow: 'truncate',
          width: 150,
          formatter: (value: string) => etiquetaCapacitador(value),
        },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      series: SERIES.map(
        (s): BarSeriesOption => ({
          name: s.label,
          type: 'bar',
          cursor: 'pointer',
          barMaxWidth: 24,
          barGap: '20%',
          barCategoryGap: '34%',
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: qiVTextGradient(s.color, 0.95, 0.4),
            shadowColor: withAlpha(s.color, 0.35),
            shadowBlur: 10,
            shadowOffsetY: 4,
          },
          emphasis: {
            focus: 'series',
            itemStyle: { shadowColor: withAlpha(s.color, 0.6), shadowBlur: 22 },
          },
          label: {
            show: true,
            position: 'top',
            color: '#cbd5e1',
            fontSize: 10,
            fontWeight: 700,
            formatter: (p) => {
              const v = Number((p as { value?: unknown }).value) || 0;
              return v > 0 ? formatNumber(v) : '';
            },
          },
          animationDelay: (idx: number) => idx * 45,
          animationDuration: 750,
          animationEasing: 'cubicOut',
          data: rows.map((r) => r[s.key]),
        }),
      ),
    };
    if (rows.length > 12) {
      opt.dataZoom = [{ type: 'inside', start: 0, end: Math.max(20, (12 / rows.length) * 100) }];
    }
    return opt;
  }, [rows]);

  return (
    <section>
      {highlights && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <HighlightCard
            index={0}
            icon={CheckCircle2}
            label="Mayor aprobación"
            color="#10b981"
            entry={highlights.mejorAprobacion}
            value={highlights.mejorAprobacion ? tasaAprobacion(highlights.mejorAprobacion) : 0}
            format="percent"
            emptyLabel="Sin procesos concluidos"
            helper={
              highlights.mejorAprobacion
                ? `${formatNumber(highlights.mejorAprobacion.aprobados)} aprobados de ${formatNumber(highlights.mejorAprobacion.finalizados)} concluidos`
                : '—'
            }
          />
          <HighlightCard
            index={1}
            icon={UserX}
            label="Mayor deserción"
            color="#71717a"
            entry={highlights.mayorDesercion}
            value={highlights.mayorDesercion.desercion}
            emptyLabel="Sin deserciones"
            helper={`${share(highlights.mayorDesercion, highlights.mayorDesercion.desercion).toFixed(1)}% de sus ${formatNumber(highlights.mayorDesercion.finalizados)} procesos concluidos`}
          />
          <HighlightCard
            index={2}
            icon={AlertCircle}
            label="Mayor baja en capacitación"
            color="#f97316"
            entry={highlights.mayorBaja}
            value={highlights.mayorBaja.bajasCapacitacion}
            emptyLabel="Sin bajas"
            helper={`${share(highlights.mayorBaja, highlights.mayorBaja.bajasCapacitacion).toFixed(1)}% de sus ${formatNumber(highlights.mayorBaja.finalizados)} procesos concluidos`}
          />
        </div>
      )}

      <div className="mt-3 space-y-3">
        <PeriodoHeader periodo={periodo} global={globalCifras} seleccion={seleccionCifras} />

        <ChartCard
          title="Rendimiento de capacitación por capacitador"
          description="Comparativa de ingresos, aprobados, bajas y deserciones"
          icon={<BarChart3 className="size-4" />}
          toolbar={
            <div className="w-[248px]">
              <CapacitadorMultiSelect
                value={selected}
                onChange={setSelected}
                options={options}
                showChips={false}
              />
            </div>
          }
        >
          {rows.length > 0 ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="mb-2 flex items-center gap-2 rounded-xl border border-brand-400/25 bg-brand-500/[0.07] px-3 py-2"
              >
                <span className="relative flex size-6 shrink-0 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-brand-500/25" />
                  <MousePointerClick className="relative size-3.5 text-brand-400" />
                </span>
                <p className="text-[11px] leading-snug font-semibold text-ink-soft">
                  Gráfica interactiva: haz <span className="font-bold text-ink">clic en cualquier barra</span> o en{' '}
                  <span className="font-bold text-ink">el nombre del capacitador</span> para abrir el detalle de sus
                  registros.
                </p>
              </motion.div>
              <QiEChart option={option} height={520} onEvents={chartEvents} />
            </>
          ) : (
            <ChartEmpty />
          )}
        </ChartCard>
      </div>
    </section>
  );
}

interface HighlightCardProps {
  index: number;
  icon: LucideIcon;
  label: string;
  color: string;
  entry: CapacitadorSummary | null;
  value: number;
  format?: 'number' | 'percent';
  emptyLabel: string;
  helper: string;
}

function HighlightCard({ index, icon: Icon, label, color, entry, value, format = 'number', emptyLabel, helper }: HighlightCardProps) {
  const isEmpty = !entry || value <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div
        className="relative h-full overflow-hidden rounded-2xl border border-line bg-surface-2 p-3.5 shadow-card transition-all duration-300 group-hover:-translate-y-0.5"
        style={{ boxShadow: `0 1px 3px rgba(0,0,0,0.25), 0 18px 40px -28px ${color}` }}
      >
        <span
          className="pointer-events-none absolute inset-x-3 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.65 }}
        />
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border"
            style={{ borderColor: withAlpha(color, 0.28), background: withAlpha(color, 0.12), color }}
          >
            <Icon className="size-4" />
          </span>
          <p className="min-w-0 flex-1 truncate text-[10px] font-bold tracking-[0.12em] text-ink-muted uppercase">{label}</p>
        </div>

        {isEmpty ? (
          <p className="mt-2.5 text-sm font-bold text-ink-soft">{emptyLabel}</p>
        ) : (
          <>
            <p className="mt-2 text-2xl font-extrabold leading-none tracking-tight text-ink">
              <CountUp value={value} format={format} />
            </p>
            <p className="mt-1.5 truncate text-xs font-bold" style={{ color }} title={entry.capacitador}>
              {entry.capacitador}
            </p>
            <p className="mt-0.5 truncate text-[10px] font-medium text-ink-soft">{helper}</p>
          </>
        )}
      </div>
    </motion.div>
  );
}
