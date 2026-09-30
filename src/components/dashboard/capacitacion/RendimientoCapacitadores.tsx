'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  UserX,
  MousePointerClick,
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import type { BarSeriesOption, EChartsOption } from 'echarts';
import type { CapacitadorSummary, Kpis } from '@/types';
import { useDataStore } from '@/store/useDataStore';
import { ChartCard } from '@/components/charts/ChartCard';
import { QiEChart, qiVTextGradient, tipDivider, tipFooter, tipHeader, tipRow } from '@/components/charts/EChart';
import { ChartEmpty } from '@/components/charts/charts';
import { CapacitadorMultiSelect } from '@/components/filters/CapacitadorMultiSelect';
import { CountUp } from '@/components/ui/count-up';
import { periodoLabel } from '@/lib/dates';
import { formatNumber } from '@/lib/utils';
import { PeriodoHeader, type PeriodoCifras } from './PeriodoHeader';

const COLOR = {
  totalIngresos: '#3b82f6',
  inician: '#38bdf8',
  aprobados: '#10b981',
  bajas: '#f97316',
  desercion: '#52525b',
  enCapacitacion: '#FACC15',
} as const;

const SERIES = [
  { key: 'asignados', label: 'Total Ingresos', color: COLOR.totalIngresos },
  { key: 'aprobados', label: 'Aprobados', color: COLOR.aprobados },
  { key: 'bajasCapacitacion', label: 'Bajas durante Capacitación', color: COLOR.bajas },
  { key: 'desercion', label: 'Deserción', color: COLOR.desercion },
  { key: 'enCapacitacion', label: 'En Capacitación', color: COLOR.enCapacitacion },
] as const;

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** % Aprobación = APROBADOS / INICIAN CAPACITACIÓN (mismo criterio que los KPIs). */
function tasaAprobacion(r: CapacitadorSummary): number {
  return r.inicianCapacitacion > 0 ? (r.aprobados / r.inicianCapacitacion) * 100 : 0;
}

function tasaCaida(r: CapacitadorSummary): number {
  return r.inicianCapacitacion > 0 ? (r.bajasCapacitacion / r.inicianCapacitacion) * 100 : 0;
}

function share(r: CapacitadorSummary, value: number): number {
  return r.asignados > 0 ? (value / r.asignados) * 100 : 0;
}

/** VALIDACIÓN: APROBADOS + BAJAS + EN CAPACITACIÓN = INICIAN CAPACITACIÓN */
function particionCierra(r: CapacitadorSummary): boolean {
  return r.aprobados + r.bajasCapacitacion + r.enCapacitacion === r.inicianCapacitacion;
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
      inician: kpis.inicianCapacitacion,
      aprobados: kpis.pasanAOperaciones,
      bajas: kpis.bajasCapacitacion,
      desercion: kpis.desercion,
      enCapacitacion: kpis.enCapacitacion,
    }),
    [kpis],
  );

  const seleccionCifras = useMemo(() => {
    if (selected.length === 0) return null;
    const total = rows.reduce(
      (acc, r) => ({
        ingresos: acc.ingresos + r.asignados,
        inician: acc.inician + r.inicianCapacitacion,
        aprobados: acc.aprobados + r.aprobados,
        bajas: acc.bajas + r.bajasCapacitacion,
        desercion: acc.desercion + r.desercion,
        enCapacitacion: acc.enCapacitacion + r.enCapacitacion,
      }),
      { ingresos: 0, inician: 0, aprobados: 0, bajas: 0, desercion: 0, enCapacitacion: 0 },
    );
    const etiqueta =
      rows.length === 1
        ? rows[0].capacitador
        : `${rows.length} capacitadores · ${rows.map((r) => r.capacitador).join(', ')}`;
    return { ...total, etiqueta };
  }, [rows, selected.length]);

  /**
   * VALIDACIÓN: la suma de las ramas de "Inician Capacitación" debe cerrar
   * contra el propio total, y el total contra Deserción + Inician + Sin
   * clasificar. Se muestra en pantalla para que ningún registro quede
   * "faltante" sin que el usuario lo note.
   */
  const validacion = useMemo(() => {
    const tot = rows.reduce(
      (acc, r) => ({
        asignados: acc.asignados + r.asignados,
        inician: acc.inician + r.inicianCapacitacion,
        aprobados: acc.aprobados + r.aprobados,
        bajas: acc.bajas + r.bajasCapacitacion,
        desercion: acc.desercion + r.desercion,
        enCapacitacion: acc.enCapacitacion + r.enCapacitacion,
        sinClasificar: acc.sinClasificar + r.sinClasificar,
      }),
      { asignados: 0, inician: 0, aprobados: 0, bajas: 0, desercion: 0, enCapacitacion: 0, sinClasificar: 0 },
    );
    const ramas = tot.aprobados + tot.bajas + tot.enCapacitacion;
    const desbalance = rows.filter((r) => !particionCierra(r));
    return {
      ...tot,
      ramas,
      ok: ramas === tot.inician && tot.asignados === tot.desercion + tot.inician + tot.sinClasificar && desbalance.length === 0,
      desbalance,
    };
  }, [rows]);

  const highlights = useMemo(() => {
    if (rows.length === 0) return null;
    const conIniciados = rows.filter((r) => r.inicianCapacitacion > 0);
    return {
      mejorAprobacion: conIniciados.length
        ? conIniciados.reduce((a, b) => (tasaAprobacion(b) > tasaAprobacion(a) ? b : a))
        : null,
      mayorDesercion: rows.reduce((a, b) => (b.desercion > a.desercion ? b : a)),
      mayorBaja: rows.reduce((a, b) => (b.bajasCapacitacion > a.bajasCapacitacion ? b : a)),
      mayorEnCapacitacion: rows.reduce((a, b) => (b.enCapacitacion > a.enCapacitacion ? b : a)),
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
            tipRow(COLOR.totalIngresos, 'Total Ingresos', formatNumber(row.asignados)) +
            tipRow(COLOR.inician, 'Inician Capacitación', formatNumber(row.inicianCapacitacion)) +
            tipRow(COLOR.aprobados, 'Aprobados', formatNumber(row.aprobados)) +
            tipRow(COLOR.bajas, 'Bajas durante Capacitación', formatNumber(row.bajasCapacitacion)) +
            tipRow(COLOR.desercion, 'Deserción', formatNumber(row.desercion)) +
            tipRow(COLOR.enCapacitacion, 'En Capacitación', formatNumber(row.enCapacitacion)) +
            tipDivider() +
            tipFooter(COLOR.aprobados, '% Aprobación', `${tasaAprobacion(row).toFixed(1)}%`)
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
          barMaxWidth: 20,
          barGap: '16%',
          barCategoryGap: '30%',
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HighlightCard
            index={0}
            icon={CheckCircle2}
            label="Mayor aprobación"
            color={COLOR.aprobados}
            entry={highlights.mejorAprobacion}
            value={highlights.mejorAprobacion ? tasaAprobacion(highlights.mejorAprobacion) : 0}
            format="percent"
            emptyLabel="Sin procesos iniciados"
            helper={
              highlights.mejorAprobacion
                ? `${formatNumber(highlights.mejorAprobacion.aprobados)} aprobados de ${formatNumber(highlights.mejorAprobacion.inicianCapacitacion)} que iniciaron`
                : '—'
            }
          />
          <HighlightCard
            index={1}
            icon={GraduationCap}
            label="Mayor carga activa"
            color={COLOR.enCapacitacion}
            entry={highlights.mayorEnCapacitacion}
            value={highlights.mayorEnCapacitacion.enCapacitacion}
            emptyLabel="Sin registros en capacitación"
            helper={`${formatNumber(highlights.mayorEnCapacitacion.enCapacitacion)} de ${formatNumber(highlights.mayorEnCapacitacion.inicianCapacitacion)} que iniciaron`}
          />
          <HighlightCard
            index={2}
            icon={UserX}
            label="Mayor deserción"
            color="#71717a"
            entry={highlights.mayorDesercion}
            value={highlights.mayorDesercion.desercion}
            emptyLabel="Sin deserciones"
            helper={`${share(highlights.mayorDesercion, highlights.mayorDesercion.desercion).toFixed(1)}% de sus ${formatNumber(highlights.mayorDesercion.asignados)} ingresos`}
          />
          <HighlightCard
            index={3}
            icon={AlertCircle}
            label="Mayor baja en capacitación"
            color={COLOR.bajas}
            entry={highlights.mayorBaja}
            value={highlights.mayorBaja.bajasCapacitacion}
            emptyLabel="Sin bajas"
            helper={`${tasaCaida(highlights.mayorBaja).toFixed(1)}% de los ${formatNumber(highlights.mayorBaja.inicianCapacitacion)} que iniciaron`}
          />
        </div>
      )}

      <div className="mt-3 space-y-3">
        <PeriodoHeader periodo={periodo} global={globalCifras} seleccion={seleccionCifras} />

        <ChartCard
          title="Rendimiento de capacitación por capacitador"
          description="Ingresos, aprobados, bajas, deserciones y los que siguen activos en capacitación"
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
              <ValidacionParticion validacion={validacion} rows={rows.length} />
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

interface ValidacionParticionData {
  asignados: number;
  inician: number;
  aprobados: number;
  bajas: number;
  desercion: number;
  enCapacitacion: number;
  sinClasificar: number;
  ramas: number;
  ok: boolean;
  desbalance: CapacitadorSummary[];
}

/**
 * VALIDACIÓN visible de la partición:
 *   APROBADOS + BAJAS + EN CAPACITACIÓN = INICIAN CAPACITACIÓN
 *   TOTAL INGRESOS = DESERCIÓN + INICIAN + SIN CLASIFICAR
 */
function ValidacionParticion({ validacion, rows }: { validacion: ValidacionParticionData; rows: number }) {
  const { ok, ramas, inician, asignados, sinClasificar, desbalance } = validacion;
  const Icon = ok ? ShieldCheck : ShieldAlert;
  const tone = ok ? '#10b981' : '#f97316';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border px-3 py-2"
      style={{ borderColor: withAlpha(tone, 0.3), background: withAlpha(tone, 0.07) }}
      data-testid="validacion-particion"
      data-ok={ok}
    >
      <span className="flex items-center gap-1.5">
        <Icon className="size-3.5" style={{ color: tone }} />
        <span className="text-[11px] font-bold" style={{ color: tone }}>
          {ok ? 'Partición validada' : 'Revisar datos'}
        </span>
      </span>
      <p className="text-[11px] leading-snug font-medium text-ink-soft">
        Aprobados <span className="font-bold text-ink tabular-nums">{formatNumber(validacion.aprobados)}</span> + Bajas{' '}
        <span className="font-bold text-ink tabular-nums">{formatNumber(validacion.bajas)}</span> + En Capacitación{' '}
        <span className="font-bold text-ink tabular-nums">{formatNumber(validacion.enCapacitacion)}</span> = Inician
        Capacitación <span className="font-bold text-ink tabular-nums">{formatNumber(inician)}</span>
        {ok ? (
          <span className="text-ink-muted"> · {rows} capacitadores sin registros faltantes</span>
        ) : (
          <>
                        {' '}
            · desbalance{' '}
            <span className="font-bold text-ink tabular-nums">{formatNumber(Math.abs(ramas - inician))}</span>
{' '}
            {desbalance.length > 0 && (
              <span className="text-ink-muted">
                {' '}
                en {desbalance.map((d) => d.capacitador).join(', ')}
              </span>
            )}
          </>
        )}
      </p>
      {sinClasificar > 0 && (
        <p className="text-[10px] font-semibold text-ink-muted">
          {formatNumber(sinClasificar)} de {formatNumber(asignados)} sin TOTAL DE DÍAS registrado
        </p>
      )}
    </motion.div>
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
