'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { EChartsOption } from 'echarts';
import { formatNumber } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import { BarChart3 } from 'lucide-react';
import { QiEChart, qiVTextGradient, tipHeader, tipRow } from '@/components/charts/EChart';

export const CHART_COLORS = ['#e30613', '#ff2735', '#ffffff', '#52525b', '#a1a1aa', '#ff6b6b', '#71717a', '#ffb9bc'];

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_GRADIENTS: Array<[string, string]> = [
  ['#e30613', '#ff2735'],
  ['#ff2735', '#ff6b6b'],
  ['#ffffff', '#d4d4d8'],
  ['#52525b', '#a1a1aa'],
  ['#7a030a', '#e30613'],
  ['#ff6b6b', '#e30613'],
];

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shortNum(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export function BaseBarChart({
  data,
  dataKey = 'value',
  nameKey = 'name',
  color = CHART_COLORS[0],
  height = 260,
  radius = 10,
}: {
  data: Array<Record<string, number | string>>;
  dataKey?: string;
  nameKey?: string;
  color?: string;
  height?: number;
  radius?: number;
}) {
  const rows = data as Array<Record<string, number | string> & { [key: string]: number | string }>;
  if (!rows.length) return <NoData />;
  const total = rows.reduce((acc, d) => acc + (Number(d[dataKey]) || 0), 0);
  const max = Math.max(...rows.map((d) => Number(d[dataKey]) || 0), 1);

  const option: EChartsOption = {
    grid: { containLabel: true, top: 28, left: 8, right: 8, bottom: 0 },
    xAxis: {
      type: 'category',
      data: rows.map((d) => String(d[nameKey])),
      axisLabel: { color: '#a1a1aa', fontSize: 11, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
      axisLabel: { color: '#a1a1aa', fontSize: 11, formatter: (v: number) => shortNum(v) },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(255,255,255,0.045)' } },
      formatter: (ps) => {
        const params = Array.isArray(ps) ? ps : [ps];
        const first = params[0];
        const value = Number(first?.value) || 0;
        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
        const row = first?.data as Record<string, number | string> | undefined;
        return (
          tipHeader(String(row?.[nameKey] ?? first?.name ?? '—')) +
          tipRow(color, String(nameKey), formatNumber(value), `${pct}%`)
        );
      },
    },
    series: [
      {
        type: 'bar',
        data: rows.map((d) => ({
          value: Number(d[dataKey]) || 0,
          itemStyle: color ? { color: qiVTextGradient(color, 1, 0.35) } : undefined,
        })),
        barMaxWidth: 44,
        itemStyle: {
          borderRadius: [radius, radius, 0, 0],
          shadowColor: hexToRgba(color, 0.35),
          shadowBlur: 12,
        },
        label: {
          show: true,
          position: 'top',
          color: '#f4f4f5',
          fontSize: 11,
          fontWeight: 700,
          formatter: (p) => formatNumber(Number(p.value) || 0),
        },
        showBackground: true,
        backgroundStyle: { color: 'rgba(255,255,255,0.045)', borderRadius: [radius, radius, 0, 0] },
        animationDelay: (idx: number) => idx * 70,
        animationDuration: 650,
        animationEasing: 'cubicOut',
      },
    ],
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <QiEChart option={option} height={height} />
      <div className="mt-1 flex justify-between border-t border-white/5 pt-2 text-[11px] text-ink-soft">
        <span>
          Máximo: <span className="font-bold text-ink">{formatNumber(max)}</span>
        </span>
        <span>
          Promedio: <span className="font-bold text-ink">{formatNumber(Math.round(total / rows.length))}</span>
        </span>
      </div>
    </motion.div>
  );
}

interface RankingDatum {
  name: string;
  value: number;
}

export function HorizontalRankingChart({
  data,
  height,
  icon: Icon,
}: {
  data: RankingDatum[];
  height?: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (!data.length) return <NoData />;
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const max = Math.max(...data.map((d) => d.value), 1);
  const rows = [...data].sort((a, b) => b.value - a.value);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
      className="flex flex-col gap-2.5"
      style={{ minHeight: height ?? Math.max(180, rows.length * 46) }}
    >
      {rows.map((row, i) => {
        const [from, to] = RANK_GRADIENTS[i % RANK_GRADIENTS.length];
        const pct = total > 0 ? (row.value / total) * 100 : 0;
        const width = (row.value / max) * 100;
        const isTop = i < 3;
        return (
          <motion.div
            key={row.name}
            variants={{
              hidden: { opacity: 0, x: -14 },
              show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
            }}
            className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-200 hover:bg-white/[0.03]"
          >
            <span className="flex w-7 shrink-0 justify-center">
              {isTop ? (
                <span
                  className="relative rounded-lg px-1 py-0.5 text-sm leading-none"
                  style={{ filter: `drop-shadow(0 0 8px ${hexToRgba(from, 0.8)})` }}
                >
                  {MEDALS[i]}
                </span>
              ) : (
                <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] font-bold text-ink-soft tabular-nums">
                  {i + 1}
                </span>
              )}
            </span>
            <span className="flex w-4 shrink-0 items-center justify-center">
              {Icon ? (
                <span className="flex size-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-ink-soft">
                  <Icon className="size-3.5" />
                </span>
              ) : null}
            </span>
            <div className="flex-1">
              <div className="mb-1 flex items-baseline gap-2">
                <span className="truncate text-sm font-semibold text-ink" title={row.name}>
                  {row.name}
                </span>
                {isTop && <span className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide" style={{ background: hexToRgba(from, 0.18), color: to }}>Top {i + 1}</span>}
              </div>
              <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="relative h-full overflow-hidden rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${from}, ${to})`,
                    boxShadow: `0 0 14px ${hexToRgba(from, 0.55)}, inset 0 0 6px ${hexToRgba('#ffffff', 0.35)}`,
                    transition: 'box-shadow 0.25s ease',
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
                </motion.div>
              </div>
            </div>
            <div className="w-24 shrink-0 text-right">
              <p className="text-sm font-bold text-ink tabular-nums">{formatNumber(row.value)}</p>
              <p className="text-[11px] font-semibold text-ink-soft tabular-nums">{pct.toFixed(1)}%</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export function DonutChart({
  data,
  height = 280,
  colors = CHART_COLORS,
  centerLabel,
  centerValue,
  formatter,
}: {
  data: Array<{ name: string; value: number }>;
  height?: number;
  colors?: string[];
  centerLabel?: string;
  centerValue?: string | number;
  formatter?: (value: number | string, name: string) => string;
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (!total) return <NoData />;

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params as { name?: string; value?: number; color?: string };
        const value = Number(p.value) || 0;
        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
        const text = formatter ? formatter(value, String(p.name ?? '—')) : formatNumber(value);
        return tipHeader(String(p.name ?? '—')) + tipRow(p.color ?? colors[0], 'Registros', text, `${pct}%`);
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['70%', '92%'],
        center: ['50%', '44%'],
        padAngle: 4,
        itemStyle: { borderColor: 'var(--surface-2)', borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scaleSize: 8, itemStyle: { shadowColor: 'rgba(227,6,19,0.5)', shadowBlur: 22 } },
        animationDuration: 900,
        animationEasing: 'cubicOut',
        data: data.map((entry, i) => ({
          name: entry.name,
          value: entry.value,
          itemStyle: {
            color: colors[i % colors.length],
            shadowColor: hexToRgba(colors[i % colors.length], 0.45),
            shadowBlur: 14,
          },
        })),
      },
    ],
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
      <div className="relative" style={{ height }}>
        <QiEChart option={option} height={height} />
        {(centerLabel || centerValue) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
            <span className="text-[10px] font-bold tracking-[0.2em] text-ink-muted uppercase">TOTAL</span>
            {typeof centerValue === 'number' ? (
              <span className="text-4xl font-bold tracking-tight text-ink" style={{ textShadow: '0 0 18px rgba(227,6,19,0.5)' }}>
                <CountUp value={centerValue} />
              </span>
            ) : centerValue ? (
              <span className="text-4xl font-bold tracking-tight text-ink" style={{ textShadow: '0 0 18px rgba(227,6,19,0.5)' }}>
                {centerValue}
              </span>
            ) : null}
            {centerLabel && (
              <span className="mt-1 max-w-[9rem] text-center text-[10px] font-semibold tracking-wide text-ink-soft uppercase">{centerLabel}</span>
            )}
          </div>
        )}
      </div>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        className="mt-3 space-y-1.5"
      >
        {data.map((entry, i) => {
          const c = colors[i % colors.length];
          const pct = (entry.value / total) * 100;
          return (
            <motion.div
              key={entry.name}
              variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.35 } } }}
              className="flex items-center gap-2 text-xs"
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
              <span className="truncate font-medium text-ink-muted">{entry.name}</span>
              <span className="ml-auto font-bold text-ink tabular-nums">{formatNumber(entry.value)}</span>
              <span className="w-12 text-right font-semibold text-ink-soft tabular-nums">{pct.toFixed(1)}%</span>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

export function PremiumAreaChart({
  data,
  height = 280,
}: {
  data: Array<Record<string, number | string> & { name: string }>;
  height?: number;
}) {
  const rows = data as Array<{ name: string } & Record<string, number | string>>;
  if (!rows.length) return <NoData />;
  const seriesKeys = Object.keys(rows[0]).filter(
    (k) => k !== 'name' && typeof rows[0][k] === 'number' && k !== '__typename',
  );

  const SERIES_COLORS: Array<{ key: string; color: string }> = [
    { key: 'Asistieron', color: '#10b981' },
    { key: 'Faltaron', color: '#f43f5e' },
  ];
  const active = SERIES_COLORS.filter((s) => seriesKeys.includes(s.key));
  const metaKey = seriesKeys.find((k) => !active.some((s) => s.key === k));

  const option: EChartsOption = {
    grid: { containLabel: true, top: 32, left: 8, right: 8, bottom: 4 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: 'rgba(255,255,255,0.15)' } },
      formatter: (ps) => {
        const params = (Array.isArray(ps) ? ps : [ps]) as Array<{ seriesName?: string; name?: string; value?: number }>;
        const datum = rows[Math.max(0, params[0]?.name ? rows.findIndex((r) => r.name === params[0]?.name) : 0)] ?? rows[0];
        if (!params.length) return '';
        let html = tipHeader(String(params[0]?.name ?? ''));
        for (const p of params) {
          const color = active.find((s) => s.key === p.seriesName)?.color ?? '#a1a1aa';
          const key = p.seriesName ?? '';
          const metaValue = typeof datum?.[key] === 'number' ? formatNumber(Number(datum[key])) : formatNumber(Number(p.value) || 0);
          html += tipRow(color, String(p.seriesName), metaValue);
        }
        if (metaKey && datum != null) {
          const metaNum = Number(datum[metaKey]) || 0;
          html += `<div style="margin-top:6px;padding:6px 10px;border-radius:8px;background:rgba(227,6,19,0.12);display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#fda4af"><span>${metaKey}</span><span>${metaNum.toFixed(1)}%</span></div>`;
        }
        return html;
      },
    },
    legend: {
      data: active.map((s) => s.key),
      top: 0,
      right: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#a1a1aa', fontSize: 12 },
    },
    xAxis: { type: 'category', data: rows.map((r) => r.name), axisLabel: { color: '#a1a1aa', fontSize: 11, hideOverlap: true } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } }, axisLabel: { color: '#a1a1aa', fontSize: 11, formatter: (v: number) => shortNum(v) } },
    series: active.map((s) => ({
      type: 'line',
      name: s.key,
      data: rows.map((r) => Number(r[s.key]) || 0),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: s.color, width: 2.5, shadowColor: hexToRgba(s.color, 0.5), shadowBlur: 10 },
      areaStyle: { color: qiVTextGradient(s.color, 0.4, 0.02) },
      emphasis: { focus: 'series', lineStyle: { width: 3.5 } },
      animationDuration: 700,
      animationEasing: 'cubicOut',
    })),
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <QiEChart option={option} height={height} />
    </motion.div>
  );
}

export function SegmentBar({ data, height = 14 }: { data: Array<{ name: string; value: number }>; height?: number }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (!total) return <NoData />;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex w-full overflow-hidden rounded-full"
      style={{ height, boxShadow: 'inset 0 0 8px rgba(0,0,0,0.35)' }}
    >
      {data.map((segment, i) => {
        const [from, to] = RANK_GRADIENTS[i % RANK_GRADIENTS.length];
        return (
          <motion.div
            key={segment.name}
            title={`${segment.name}: ${segment.value}`}
            initial={{ width: 0 }}
            animate={{ width: `${(segment.value / total) * 100}%` }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
          />
        );
      })}
    </motion.div>
  );
}

function NoData() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-2 bg-surface/40 text-ink-soft"
    >
      <span className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg text-ink-muted">
        <BarChart3 className="size-5" />
      </span>
      <p className="text-sm font-medium">Sin datos para mostrar</p>
      <p className="text-xs">Carga un archivo Excel con información de capacitación.</p>
    </motion.div>
  );
}

export function ChartEmpty() {
  return <NoData />;
}