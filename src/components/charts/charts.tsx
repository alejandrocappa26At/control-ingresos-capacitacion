'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { EChartsOption } from 'echarts';
import { formatNumber } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import { BarChart3 } from 'lucide-react';
import { QiEChart, qiVTextGradient, tipHeader, tipRow } from '@/components/charts/EChart';

export const CHART_COLORS = ['#e30613', '#ff3b47', '#00d26a', '#ffb800', '#ff7a00', '#8b5cf6', '#2563eb', '#64748b'];

const MEDALS = ['🥇', '🥈', '🥉'];

function parseHex(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixColor(from: string, to: string, t: number): string {
  const a = parseHex(from);
  const b = parseHex(to);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
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
  radius = 8,
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
      axisLabel: { color: '#94a3b8', fontSize: 11, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v: number) => shortNum(v) },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(148,163,184,0.08)' } },
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
        },
        label: {
          show: true,
          position: 'top',
          color: '#94a3b8',
          fontSize: 11,
          fontWeight: 700,
          formatter: (p) => formatNumber(Number(p.value) || 0),
        },
        showBackground: true,
        backgroundStyle: { color: 'rgba(148,163,184,0.08)', borderRadius: [radius, radius, 0, 0] },
        animationDelay: (idx: number) => idx * 70,
        animationDuration: 650,
        animationEasing: 'cubicOut',
      },
    ],
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <QiEChart option={option} height={height} />
      <div className="mt-1 flex justify-between border-t border-line pt-2 text-[11px] text-ink-soft">
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
  color = '#e30613',
}: {
  data: RankingDatum[];
  height?: number;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
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
        const pct = total > 0 ? (row.value / total) * 100 : 0;
        const width = (row.value / max) * 100;
        const isTop = i < 3;
        const alpha = Math.max(0.55, 1 - i * 0.07);
        return (
          <motion.div
            key={row.name}
            variants={{
              hidden: { opacity: 0, x: -14 },
              show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
            }}
            className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-200 hover:bg-surface-3/60"
          >
            <span className="flex w-7 shrink-0 justify-center">
              {isTop ? (
                <span className="relative rounded-lg px-1 py-0.5 text-sm leading-none">{MEDALS[i]}</span>
              ) : (
                <span className="rounded-md bg-ink/10 px-1.5 py-0.5 text-[11px] font-bold text-ink-soft tabular-nums">
                  {i + 1}
                </span>
              )}
            </span>
            <span className="flex w-4 shrink-0 items-center justify-center">
              {Icon ? (
                <span className="flex size-6 items-center justify-center rounded-md border border-line bg-surface-3/60 text-ink-muted">
                  <Icon className="size-3.5" />
                </span>
              ) : null}
            </span>
            <div className="flex-1">
              <div className="mb-1 flex items-baseline gap-2">
                <span className="truncate text-sm font-semibold text-ink" title={row.name}>
                  {row.name}
                </span>
                {isTop && (
                  <span className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide" style={{ background: hexToRgba(color, 0.14), color }}>
                    Top {i + 1}
                  </span>
                )}
              </div>
              <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-ink/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="relative h-full overflow-hidden rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${hexToRgba(color, alpha - 0.12)}, ${hexToRgba(color, alpha)})`,
                    boxShadow: `0 3px 10px -6px ${hexToRgba(color, 0.4)}`,
                    transition: 'box-shadow 0.25s ease',
                  }}
                >
                  <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
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

export function ExecutiveTreemap({
  data,
  height = 300,
  base = '#e30613',
}: {
  data: Array<{ name: string; value: number }>;
  height?: number;
  base?: string;
}) {
  const rows = data.filter((d) => d.value > 0);
  if (!rows.length) return <NoData />;
  const total = rows.reduce((acc, d) => acc + d.value, 0);
  const max = Math.max(...rows.map((d) => d.value), 1);
  const dark = mixColor(base, '#0b0f17', 0.85);
  const light = mixColor(base, '#ffffff', 0.5);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const p = params as { name?: string; value?: number; color?: string };
        const value = Number(p.value) || 0;
        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
        return tipHeader(String(p.name ?? '—')) + tipRow(p.color ?? base, 'Ingresos', formatNumber(value), `${pct}%`);
      },
    },
    series: [
      {
        type: 'treemap',
        sort: 'desc',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        top: 8,
        left: 0,
        right: 0,
        bottom: 0,
        itemStyle: { borderColor: 'var(--surface-2)', borderWidth: 3, borderRadius: 8 },
        label: { show: true, fontSize: 12, fontWeight: 700 },
        upperLabel: { show: false },
        emphasis: { itemStyle: { borderWidth: 4 } },
        animationDuration: 700,
        animationEasing: 'cubicOut',
        data: rows.map((d) => {
          const t = d.value / max;
          return {
            name: d.name,
            value: d.value,
            itemStyle: { color: mixColor(light, base, t) },
            label: { color: t > 0.5 ? '#ffffff' : dark },
          };
        }),
      },
    ],
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <QiEChart option={option} height={height} />
      <div className="mt-1 flex justify-between border-t border-line pt-2 text-[11px] text-ink-soft">
        <span>
          Sedes: <span className="font-bold text-ink">{rows.length}</span>
        </span>
        <span>
          Mayor: <span className="font-bold text-ink">{formatNumber(max)}</span> · Intensidad = volumen
        </span>
      </div>
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
        emphasis: { scaleSize: 8, itemStyle: { shadowColor: 'rgba(0,0,0,0.5)', shadowBlur: 8 } },
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
              <span className="text-4xl font-bold tracking-tight text-ink" style={{ textShadow: 'none' }}>
                <CountUp value={centerValue} />
              </span>
            ) : centerValue ? (
              <span className="text-4xl font-bold tracking-tight text-ink" style={{ textShadow: 'none' }}>
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
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 2px 8px -2px ${c}aa` }} />
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

export function SemiDonutChart({
  data,
  height = 240,
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
  const rows = data.filter((d) => d.value > 0);
  const total = rows.reduce((acc, d) => acc + d.value, 0);
  if (!total || !rows.length) return <NoData />;

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
        radius: ['58%', '84%'],
        center: ['50%', '78%'],
        startAngle: 180,
        endAngle: 360,
        clockwise: true,
        padAngle: 2,
        minAngle: 2,
        itemStyle: { borderColor: 'var(--surface-2)', borderWidth: 2, borderRadius: 6 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scaleSize: 6, itemStyle: { shadowColor: 'rgba(0,0,0,0.5)', shadowBlur: 6 } },
        animationDuration: 900,
        animationEasing: 'cubicOut',
        data: rows.map((entry, i) => ({
          name: entry.name,
          value: entry.value,
          itemStyle: { color: colors[i % colors.length] },
        })),
      },
    ],
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
      <div className="relative" style={{ height }}>
        <QiEChart option={option} height={height} />
        {(centerLabel || centerValue !== undefined) && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center pt-3">
            <span className="text-[9px] font-bold tracking-[0.2em] text-ink-muted uppercase">TOTAL</span>
            {typeof centerValue === 'number' ? (
              <span className="text-4xl font-extrabold tracking-tight text-ink">
                <CountUp value={centerValue} />
              </span>
            ) : centerValue ? (
              <span className="text-4xl font-extrabold tracking-tight text-ink">{centerValue}</span>
            ) : null}
            {centerLabel && (
              <span className="mt-0.5 max-w-[9rem] text-center text-[9px] font-semibold tracking-wide text-ink-soft uppercase">{centerLabel}</span>
            )}
          </div>
        )}
      </div>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        className="mt-2 space-y-1.5"
      >
        {rows.map((entry, i) => {
          const c = colors[i % colors.length];
          const pct = (entry.value / total) * 100;
          return (
            <motion.div
              key={entry.name}
              variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.35 } } }}
              className="flex items-center gap-2 text-xs"
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: c }} />
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
    { key: 'Faltaron', color: '#ef4444' },
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
          html += `<div style="margin-top:6px;padding:6px 10px;border-radius:8px;background:rgba(227,6,19,0.16);display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#ff5a66"><span>${metaKey}</span><span>${metaNum.toFixed(1)}%</span></div>`;
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
      textStyle: { color: '#94a3b8', fontSize: 12 },
    },
    xAxis: { type: 'category', data: rows.map((r) => r.name), axisLabel: { color: '#94a3b8', fontSize: 11, hideOverlap: true } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)', type: 'dashed' } }, axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v: number) => shortNum(v) } },
    series: active.map((s) => ({
      type: 'line',
      name: s.key,
      data: rows.map((r) => Number(r[s.key]) || 0),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: s.color, width: 2.5, shadowColor: hexToRgba(s.color, 0.35), shadowBlur: 6 },
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
  const segmentColor = (name: string): string => {
    const key = name.toLowerCase();
    if (/(pasa|aprob|asistir|asistieron)/.test(key)) return '#10b981';
    if (/(no|falt|reprob|deserc|ca[ií]da)/.test(key)) return '#ef4444';
    if (/(capacit|proceso|pend|en curso)/.test(key)) return '#f59e0b';
    return '#94a3b8';
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex w-full overflow-hidden rounded-full"
      style={{ height, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)' }}
    >
      {data.map((segment, i) => {
        const color = segmentColor(segment.name);
        return (
          <motion.div
            key={segment.name}
            title={`${segment.name}: ${segment.value}`}
            initial={{ width: 0 }}
            animate={{ width: `${(segment.value / total) * 100}%` }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: `linear-gradient(90deg, ${mixColor(color, '#ffffff', 0.25)}, ${color})` }}
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