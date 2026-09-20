'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { EChartsOption } from 'echarts';
import { QiEChart, tipHeader, tipRow } from '@/components/charts/EChart';
import { ChartEmpty } from '@/components/charts/charts';
import { formatNumber } from '@/lib/utils';

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function barGradient(color: string, glossy = true): unknown {
  const rgba = hexToRgba(color, 0.55);
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: glossy
      ? [
          { offset: 0, color },
          { offset: 0.35, color: rgba },
          { offset: 0.9, color: hexToRgba('#ffffff', 0.05) },
          { offset: 1, color: hexToRgba(color, 0.18) },
        ]
      : [
          { offset: 0, color },
          { offset: 1, color: hexToRgba(color, 0.2) },
        ],
  };
}

function shortNum(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

export function CrystalBarChart({
  data,
  height = 300,
  color = '#2563eb',
}: {
  data: Array<{ name: string; value: number }>;
  height?: number;
  color?: string;
}) {
  const rows = data.filter((d) => d.value > 0);
  if (!rows.length) return <ChartEmpty />;
  const total = rows.reduce((acc, d) => acc + d.value, 0);
  const max = Math.max(...rows.map((d) => d.value), 1);

  const option: EChartsOption = {
    grid: { containLabel: true, top: 28, left: 8, right: 8, bottom: 0 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(148,163,184,0.10)' } },
      formatter: (ps) => {
        const arr = Array.isArray(ps) ? ps : [ps];
        const p = arr[0] as { name?: string; value?: number; color?: string };
        const value = Number(p.value) || 0;
        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
        return tipHeader(String(p.name ?? '')) + tipRow(String(p.color ?? color), 'Ingresos', formatNumber(value), `${pct}%`);
      },
    },
    xAxis: {
      type: 'category',
      data: rows.map((d) => d.name),
      axisLabel: { color: '#6b7280', fontSize: 11, hideOverlap: true },
      axisLine: { lineStyle: { color: 'rgba(100,116,139,0.18)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(100,116,139,0.16)', type: 'dashed' } },
      axisLabel: { color: '#9ca3af', fontSize: 11, formatter: (v: number) => shortNum(v) },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 46,
        itemStyle: {
          borderRadius: [10, 10, 3, 3],
          color: barGradient(color, true) as never,
          shadowColor: hexToRgba(color, 0.35),
          shadowBlur: 16,
          shadowOffsetY: 10,
        },
        emphasis: { itemStyle: { shadowBlur: 26, shadowColor: hexToRgba(color, 0.55) } },
        data: rows.map((d) => d.value),
        label: {
          show: true,
          position: 'top',
          color: '#374151',
          fontSize: 11,
          fontWeight: 700,
          formatter: (p) => formatNumber(Number((p as { value?: number }).value) || 0),
        },
        animationDelay: (idx: number) => idx * 60,
        animationDuration: 1100,
        animationEasing: 'cubicOut',
      },
    ],
  };

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <QiEChart option={option} height={height} />
      <div className="mt-1 flex justify-between border-t border-line pt-2 text-[11px] text-ink-soft">
        <span>Total: <span className="font-bold text-ink">{formatNumber(total)}</span></span>
        <span>Mayor: <span className="font-bold text-ink">{formatNumber(max)}</span></span>
      </div>
    </motion.div>
  );
}

export function ExecutiveLeaderboard({
  data,
  height = 320,
  color = '#2563eb',
}: {
  data: Array<{ name: string; value: number }>;
  height?: number;
  color?: string;
}) {
  const rows = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  if (!rows.length) return <ChartEmpty />;
  const total = rows.reduce((acc, d) => acc + d.value, 0);
  const max = Math.max(...rows.map((d) => d.value), 1);
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
      className="flex flex-col gap-2.5"
      style={{ minHeight: height ?? Math.max(180, rows.length * 44) }}
    >
      {rows.map((d, i) => {
        const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
        const width = Math.max(4, (d.value / max) * 100);
        const rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#a1a1aa' : i === 2 ? '#d97706' : color;
        return (
          <motion.div
            key={d.name}
            variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.35 } } }}
            className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-200 hover:bg-surface-3/60"
          >
            <span className="flex w-8 shrink-0 items-center justify-center text-lg">
              {i < 3 ? medals[i] : <span className="tabular-nums text-xs font-bold text-ink-soft">{i + 1}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-semibold text-ink" title={d.name}>{d.name}</span>
                <span className="shrink-0 text-sm font-bold text-ink tabular-nums">{formatNumber(d.value)}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${hexToRgba(rankColor, 0.6)}, ${rankColor})`, boxShadow: `0 1px 6px -1px ${hexToRgba(rankColor, 0.5)}` }}
                />
              </div>
            </div>
            <span className="w-12 shrink-0 text-right text-[11px] font-bold text-ink-soft tabular-nums">{pct}%</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export function PremiumBubbleChart({
  data,
  height = 320,
  color = '#2563eb',
}: {
  data: Array<{ name: string; value: number }>;
  height?: number;
  color?: string;
}) {
  const rows = data.filter((d) => d.value > 0);
  if (!rows.length) return <ChartEmpty />;
  const total = rows.reduce((acc, d) => acc + d.value, 0);
  const max = Math.max(...rows.map((d) => d.value), 1);

  const option: EChartsOption = {
    grid: { containLabel: true, top: 20, left: 8, right: 8, bottom: 20 },
    tooltip: {
      trigger: 'item',
      formatter: (p) => {
        const item = p as { name?: string; value?: unknown; color?: string };
        const pair = Array.isArray(item.value) ? item.value : [item.value, 0];
        const value = Number(pair[0]) || 0;
        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
        return tipHeader(String(item.name ?? '')) + tipRow(String(item.color ?? color), 'Ingresos', formatNumber(value), `${pct}%`);
      },
    },
    xAxis: { type: 'value', show: false, min: 0, max: max * 1.25 },
    yAxis: { type: 'value', show: false, min: 0, max: 8 },
    series: [
      {
        type: 'scatter',
        symbolSize: (v: number) => Math.max(52, Math.sqrt(v) * 12),
        itemStyle: {
          color: {
            type: 'radial',
            x: 0.45,
            y: 0.42,
            r: 0.9,
            colorStops: [
              { offset: 0, color: hexToRgba('#ffffff', 0.92) },
              { offset: 0.28, color: hexToRgba(color, 0.95) },
              { offset: 1, color: hexToRgba(color, 0.45) },
            ],
          },
          shadowColor: hexToRgba(color, 0.4),
          shadowBlur: 22,
        },
        label: {
          show: true,
          formatter: (p) => {
            const v = Array.isArray(p.value) ? Number(p.value[0]) || 0 : 0;
            return `${p.name}\n${formatNumber(v)}`;
          },
          color: '#ffffff',
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 16,
        },
        emphasis: { scale: 1.15, itemStyle: { shadowBlur: 34, shadowColor: hexToRgba(color, 0.6) } },
        data: rows.map((d) => ({
          name: d.name,
          value: [d.value, 0]
        })),
      },
    ],
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <QiEChart option={option} height={height} />
      <div className="mt-1 flex justify-between border-t border-line pt-2 text-[11px] text-ink-soft">
        <span>Llena: <span className="font-bold text-ink">{rows.length}</span></span>
        <span>Total: <span className="font-bold text-ink">{formatNumber(total)}</span></span>
      </div>
    </motion.div>
  );
}
