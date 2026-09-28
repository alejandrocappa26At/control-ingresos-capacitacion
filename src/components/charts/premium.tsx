'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
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

function lighten(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  const mix = (c: string) => Math.round(parseInt(c, 16) + (255 - parseInt(c, 16)) * amount);
  const r = mix(clean.slice(0, 2));
  const g = mix(clean.slice(2, 4));
  const b = mix(clean.slice(4, 6));
  return `rgb(${r}, ${g}, ${b})`;
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

function crystalGradient(from: string, to: string): unknown {
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: hexToRgba('#ffffff', 0.35) },
      { offset: 0.12, color: from },
      { offset: 0.55, color: from },
      { offset: 1, color: to },
    ],
  };
}

function shortNum(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(v);
}

interface JurisdictionStyle {
  from: string;
  to: string;
  glow: string;
}

const JURISDICTION_STYLES: Record<string, JurisdictionStyle> = {
  PROVINCIA: { from: '#2563EB', to: '#60A5FA', glow: 'rgba(37,99,235,0.55)' },
  LIMA: { from: '#7C3AED', to: '#A855F7', glow: 'rgba(124,58,237,0.55)' },
};

function styleFor(name: string, fallback: string): JurisdictionStyle {
  return (
    JURISDICTION_STYLES[name.toUpperCase()] ?? {
      from: fallback,
      to: lighten(fallback, 0.35),
      glow: hexToRgba(fallback, 0.5),
    }
  );
}

function dynamicYMax(max: number): number {
  if (max <= 0) return 10;
  if (max < 10) return 10;
  const step = max < 100 ? 10 : max < 1000 ? 100 : max < 10000 ? 1000 : 10000;
  return Math.ceil((max + step * 0.5) / step) * step;
}

export function CrystalBarChart({
  data,
  height = 300,
  color = '#EF4444',
  title = '1. INGRESOS POR JURISDICCIÓN',
  description = 'Cantidad y porcentaje por jurisdicción',
}: {
  data: Array<{ name: string; value: number }>;
  height?: number;
  color?: string;
  title?: string;
  description?: string;
}) {
  const rows = data
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  if (!rows.length) return <ChartEmpty />;

  const total = rows.reduce((acc, d) => acc + d.value, 0);
  const max = Math.max(...rows.map((d) => d.value), 1);
  const yMax = dynamicYMax(max);
  const magnitude = yMax >= 10000 ? 10000 : yMax >= 1000 ? 1000 : yMax >= 100 ? 100 : 10;
  const interval = Math.max(magnitude, Math.ceil(yMax / 6 / magnitude) * magnitude);

  const option: EChartsOption = {
    grid: { containLabel: true, top: 30, left: 8, right: 8, bottom: 4 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(37,99,235,0.08)' } },
      formatter: (ps) => {
        const arr = Array.isArray(ps) ? ps : [ps];
        const p = arr[0] as { name?: string; value?: number };
        const value = Number(p.value) || 0;
        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
        const s = styleFor(String(p.name ?? ''), color);
        return tipHeader(String(p.name ?? '')) + tipRow(s.from, 'Ingresos', formatNumber(value), `${pct}%`);
      },
    },
    xAxis: {
      type: 'category',
      data: rows.map((d) => d.name),
      axisLabel: {
        color: '#9CA3AF',
        fontSize: 11,
        hideOverlap: true,
        lineHeight: 16,
        formatter: (value: string) => {
          const item = rows.find((d) => d.name === value);
          const pct = total > 0 && item ? `${((item.value / total) * 100).toFixed(1)}%` : '';
          return `{name|${value}}\n{pct|${pct}}`;
        },
        rich: {
          name: { color: '#9CA3AF', fontSize: 11, fontWeight: 600, lineHeight: 16 },
          pct: { color: '#6B7280', fontSize: 10, lineHeight: 14 },
        } as never,
      },
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.12)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yMax,
      interval,
      splitLine: { lineStyle: { color: '#374151', type: 'dashed' } },
      axisLabel: { color: '#9CA3AF', fontSize: 11, formatter: (v: number) => shortNum(v) },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 76,
        barMinHeight: 4,
        itemStyle: {
          borderRadius: [12, 12, 0, 0],
          borderWidth: 1.5,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 24,
            borderWidth: 2,
          },
        },
        label: {
          show: true,
          position: 'top',
          color: '#F9FAFB',
          fontSize: 13,
          fontWeight: 800,
          offset: [0, 8],
          formatter: (p) => formatNumber(Number((p as { value?: number }).value) || 0),
        },
        animationDelay: (idx: number) => idx * 80,
        animationDuration: 1100,
        animationEasing: 'cubicOut',
        data: rows.map((d) => {
          const s = styleFor(d.name, color);
          return {
            value: d.value,
            itemStyle: {
              color: crystalGradient(s.from, s.to) as never,
              borderColor: s.from,
              shadowColor: s.glow,
              shadowBlur: 14,
            },
            emphasis: {
              itemStyle: {
                color: crystalGradient(s.from, lighten(s.from, 0.15)) as never,
                shadowColor: s.glow,
                shadowBlur: 26,
                borderColor: s.to,
              },
            },
          };
        }),
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="h-full rounded-xl bg-[#111827] p-4 shadow-[0_0_15px_rgba(37,99,235,0.18)]"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black/50">
          <MapPin className="size-4 text-[#60A5FA]" />
        </span>
        <div>
          <h3 className="text-sm font-medium text-[#F9FAFB]">{title}</h3>
          <p className="text-xs text-[#9CA3AF]">{description}</p>
        </div>
      </div>
      <QiEChart option={option} height={height} />
      <div className="mt-1 flex justify-between border-t border-white/10 pt-2 text-[11px] text-[#9CA3AF]">
        <span>Total: <span className="font-bold text-[#FFFFFF]">{formatNumber(total)}</span></span>
        <span>Mayor: <span className="font-bold text-[#FFFFFF]">{formatNumber(max)}</span></span>
      </div>
    </motion.div>
  );
}

export function ExecutiveLeaderboard({
  data,
  height = 320,
  color = '#e30613',
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
            variants={
              {
                hidden: { opacity: 0, x: -12 },
                show: { opacity: 1, x: 0, transition: { duration: 0.35 } },
              } as const
            }
            className="group flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-200 hover:bg-surface-3/60"
          >
            <span className="flex w-8 shrink-0 items-center justify-center text-lg">
              {i < 3 ? medals[i] : <span className="tabular-nums text-xs font-bold text-ink-soft">{i + 1}</span>}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-semibold text-ink" title={d.name}>
                  {d.name}
                </span>
                <span className="shrink-0 text-sm font-bold text-ink tabular-nums">{formatNumber(d.value)}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${hexToRgba(rankColor, 0.6)}, ${rankColor})`,
                    boxShadow: `0 1px 6px -1px ${hexToRgba(rankColor, 0.5)}`,
                  }}
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
  color = '#e30613',
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
          value: [d.value, 0],
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