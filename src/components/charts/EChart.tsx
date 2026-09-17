'use client';

import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import type { EChartsOption } from 'echarts';
import { cn } from '@/lib/utils';

export const QI_COLOR = {
  red: '#e30613',
  redLight: '#ff2735',
  redDark: '#7a030a',
  rose: '#f43f5e',
  white: '#ffffff',
  gray: '#a1a1aa',
  zinc: '#52525b',
  amber: '#f59e0b',
  emerald: '#10b981',
} as const;

export const QI_PALETTE = [
  QI_COLOR.red,
  QI_COLOR.white,
  QI_COLOR.gray,
  QI_COLOR.redLight,
  QI_COLOR.redDark,
  QI_COLOR.rose,
  QI_COLOR.amber,
  QI_COLOR.zinc,
];

echarts.registerTheme('qi-dark', {
  color: QI_PALETTE,
  backgroundColor: 'transparent',
  textStyle: { color: '#a1a1aa', fontFamily: 'inherit' },
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.10)' } },
    axisTick: { show: false },
    axisLabel: { color: '#a1a1aa', fontSize: 11 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#a1a1aa', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)', type: 'dashed' } },
  },
  legend: { textStyle: { color: '#a1a1aa' }, icon: 'roundRect' },
  tooltip: {
    backgroundColor: 'rgba(11,15,28,0.92)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    padding: [10, 14],
    textStyle: { color: '#f4f4f5', fontSize: 12, lineHeight: 20 },
    extraCssText:
      'border-radius:14px;backdrop-filter:blur(16px);box-shadow:0 18px 50px -12px rgba(0,0,0,0.7),0 0 24px rgba(227,6,19,0.12);',
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
  return `<span style="display:inline-block;width:9px;height:9px;border-radius:9999px;margin-right:8px;background:${color};box-shadow:0 0 8px ${color}"></span>`;
}

export function tipHeader(label: string): string {
  return `<div style="border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:5px;margin-bottom:6px;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#f4f4f5">${label}</div>`;
}

export function tipRow(color: string, label: string, value: string, trailing?: string): string {
  const trail = trailing
    ? `<span style="width:56px;text-align:right;font-size:11px;color:#71717a">${trailing}</span>`
    : '';
  return `<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="display:inline-block;width:9px;height:9px;border-radius:9999px;background:${color};box-shadow:0 0 8px ${color}"></span><span style="color:#a1a1aa">${label}</span><span style="margin-left:auto;font-weight:700;color:#f4f4f5">${value}</span>${trail}</div>`;
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