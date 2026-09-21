'use client';

import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import type { EChartsOption } from 'echarts';
import { cn } from '@/lib/utils';

export const QI_COLOR = {
  blue: '#e30613',
  blueLight: '#ff3b47',
  violet: '#8b5cf6',
  red: '#e30613',
  redLight: '#ff3b47',
  redDark: '#900509',
  rose: '#f43f5e',
  white: '#ffffff',
  gray: '#94a3b8',
  zinc: '#64748b',
  amber: '#f59e0b',
  emerald: '#10b981',
} as const;

export const QI_PALETTE = [
  QI_COLOR.blue,
  QI_COLOR.redLight,
  QI_COLOR.emerald,
  QI_COLOR.amber,
  QI_COLOR.violet,
  QI_COLOR.rose,
  QI_COLOR.zinc,
  QI_COLOR.gray,
];

echarts.registerTheme('qi-dark', {
  color: QI_PALETTE,
  backgroundColor: 'transparent',
  textStyle: { color: '#94a3b8', fontFamily: 'inherit' },
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    axisTick: { show: false },
    axisLabel: { color: '#94a3b8', fontSize: 11 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#94a3b8', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.07)', type: 'dashed' } },
  },
  legend: { textStyle: { color: '#94a3b8' }, icon: 'roundRect' },
  tooltip: {
    backgroundColor: '#161d2e',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    padding: [10, 14],
    textStyle: { color: '#f8fafc', fontSize: 12, lineHeight: 20 },
    extraCssText:
      'border-radius:12px;box-shadow:0 16px 40px -12px rgba(0,0,0,0.6),0 2px 8px rgba(0,0,0,0.4);backdrop-filter:blur(16px);',
  },
  grid: { containLabel: true, top: 28, left: 8, right: 8, bottom: 4 },
});

interface QiEChartProps {
  option: EChartsOption;
  height?: number | string;
  delay?: number;
  className?: string;
  onEvents?: Record<string, (params: unknown) => void>;
}

export function QiEChart({ option, height = 280, delay = 0, className, onEvents }: QiEChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn('w-full', className)}
      style={{ height }}
    >
      <ReactECharts
        option={option}
        theme="qi-dark"
        notMerge
        lazyUpdate
        opts={{ renderer: 'canvas' }}
        style={{ height: '100%', width: '100%' }}
        onEvents={onEvents}
      />
    </motion.div>
  );
}

export function tipDot(color: string): string {
  return `<span style="display:inline-block;width:9px;height:9px;border-radius:9999px;margin-right:8px;background:${color};box-shadow:0 0 6px ${color}55"></span>`;
}

export function tipHeader(label: string): string {
  return `<div style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:5px;margin-bottom:6px;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#f8fafc">${label}</div>`;
}

export function tipRow(color: string, label: string, value: string, trailing?: string): string {
  const trail = trailing
    ? `<span style="width:56px;text-align:right;font-size:11px;color:#94a3b8">${trailing}</span>`
    : '';
  return `<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="display:inline-block;width:9px;height:9px;border-radius:9999px;background:${color};box-shadow:0 0 6px ${color}55"></span><span style="color:#94a3b8">${label}</span><span style="margin-left:auto;font-weight:700;color:#f8fafc">${value}</span>${trail}</div>`;
}

export function qiVTextGradient(color: string, topOpacity: number, bottomOpacity: number) {
  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: hexA(color, topOpacity) },
      { offset: 1, color: hexA(color, bottomOpacity) },
    ],
  };
}

export function qiHGradient(from: string, to: string) {
  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 1,
    y2: 0,
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  };
}

function hexA(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}