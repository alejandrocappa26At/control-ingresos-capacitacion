'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from 'recharts';
import { formatNumber } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import { BarChart3 } from 'lucide-react';

export const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6', '#f97316'];

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_GRADIENTS: Array<[string, string]> = [
  ['#6366f1', '#22d3ee'],
  ['#8b5cf6', '#3b82f6'],
  ['#10b981', '#34d399'],
  ['#f59e0b', '#fb923c'],
  ['#ef4444', '#f43f5e'],
  ['#06b6d4', '#22d3ee'],
];

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface TooltipStyleProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; payload?: Record<string, unknown>; color?: string }>;
  label?: string;
  formatter?: (value: number | string, name: string) => string;
  total?: number;
  metaKey?: string;
  metaLabel?: string;
}

export function ChartTooltip({ active, payload, label, formatter, total, metaKey, metaLabel }: TooltipStyleProps) {
  if (!active || !payload?.length) return null;
  const dayTotal = total ?? payload.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
  const meta = metaKey ? (payload[0]?.payload?.[metaKey] as number | undefined) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong pointer-events-none rounded-2xl border border-white/15 px-4 py-3 shadow-glow backdrop-blur-xl"
    >
      {label && (
        <p className="mb-2 border-b border-white/10 pb-1.5 text-xs font-bold tracking-wide text-ink uppercase">{label}</p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, i) => {
          const value = Number(entry.value) || 0;
          const fill = entry.color ?? RANK_GRADIENTS[i % RANK_GRADIENTS.length][0];
          const pct = dayTotal > 0 ? ((value / dayTotal) * 100).toFixed(1) : '0.0';
          const text = formatter
            ? formatter(entry.value ?? 0, entry.name ?? '')
            : `${formatNumber(value)}`;
          return (
            <div key={entry.name ?? i} className="flex items-center gap-2.5 text-xs">
              <span className="size-2.5 rounded-full" style={{ background: fill, boxShadow: `0 0 10px ${fill}` }} />
              <span className="font-medium text-ink-muted">{entry.name}</span>
              <span className="ml-auto font-bold tabular-nums text-ink">{text}</span>
              {!formatter && dayTotal > 0 && <span className="w-12 text-right font-semibold tabular-nums text-ink-soft">{pct}%</span>}
            </div>
          );
        })}
      </div>
      {meta !== undefined && typeof meta === 'number' && (
        <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-brand-500/10 px-2 py-1 text-[11px] font-bold text-brand-300">
          {metaLabel ?? 'Complemento'}
          <span className="ml-auto tabular-nums">{meta.toFixed(1)}%</span>
        </p>
      )}
    </motion.div>
  );
}

type BarLabelProps = { x?: number; y?: number; width?: number; value?: number | string };

function BarLabel({ x = 0, y = 0, width = 0, value = 0 }: BarLabelProps) {
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fill="#ffffff"
      fontSize={11}
      fontWeight={700}
      style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))' }}
    >
      {formatNumber(Number(value) || 0)}
    </text>
  );
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
  const [hovered, setHovered] = React.useState<number | null>(null);
  const rows = data as Array<Record<string, number | string> & { [key: string]: number | string }>;
  if (!rows.length) return <NoData />;
  const total = rows.reduce((acc, d) => acc + (Number(d[dataKey]) || 0), 0);
  const gradientId = `gbars-${color.replace('#', '')}`;
  const max = Math.max(...rows.map((d) => Number(d[dataKey]) || 0));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} margin={{ top: 18, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="55%" stopColor={color} stopOpacity={0.85} />
              <stop offset="100%" stopColor={color} stopOpacity={0.38} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 8" stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis
            dataKey={nameKey}
            tick={{ fontSize: 11, fill: 'var(--ink-soft)' }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            interval="preserveStartEnd"
            dy={6}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--ink-soft)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={0}
            domain={[0, (dataMax: number) => Math.max(4, Math.ceil(dataMax * 1.18))]}
          />
          <Tooltip
            content={<ChartTooltip total={total} />}
            cursor={{ fill: 'rgba(255,255,255,0.045)', stroke: color, strokeOpacity: 0.3, strokeWidth: 1, radius: 8 }}
          />
          <Bar dataKey={dataKey} radius={[radius, radius, 0, 0]} maxBarSize={46} animationDuration={650} animationEasing="ease-out">
            {rows.map((entry, i) => (
              <Cell
                key={entry[nameKey] as string}
                fill={`url(#${gradientId})`}
                fillOpacity={hovered === null || hovered === i ? 1 : 0.45}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  filter: `drop-shadow(0 ${hovered === i ? 12 : 6}px ${hovered === i ? 18 : 10}px ${hexToRgba(color, hovered === i ? 0.45 : 0.25)})`,
                  transition: 'filter 0.25s ease',
                  cursor: 'pointer',
                }}
              />
            ))}
            <LabelList dataKey={dataKey} position="top" content={<BarLabel />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
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

  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}>
      <div className="relative" style={{ height }}>
        <div className="absolute inset-0" style={{ filter: 'drop-shadow(0 0 22px rgba(99,102,241,0.22))' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                {data.map((entry, i) => {
                  const c = colors[i % colors.length];
                  return (
                    <radialGradient key={entry.name} id={`dn-${c.replace('#', '')}-${i}`} cx="50%" cy="42%" r="78%">
                      <stop offset="0%" stopColor={c} stopOpacity={0.55} />
                      <stop offset="70%" stopColor={c} stopOpacity={0.92} />
                      <stop offset="100%" stopColor={c} stopOpacity={1} />
                    </radialGradient>
                  );
                })}
              </defs>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="70%"
                outerRadius="92%"
                paddingAngle={3}
                cornerRadius={12}
                stroke="var(--surface-2)"
                strokeWidth={2}
                animationDuration={900}
                animationBegin={120}
                animationEasing="ease-out"
              >
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={`url(#dn-${colors[i % colors.length].replace('#', '')}-${i})`} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip total={total} formatter={formatter} />} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {(centerLabel || centerValue) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
            <span className="text-[10px] font-bold tracking-[0.2em] text-ink-muted uppercase">TOTAL</span>
            {typeof centerValue === 'number' ? (
              <span className="text-4xl font-bold tracking-tight text-ink" style={{ textShadow: '0 0 18px rgba(99,102,241,0.45)' }}>
                <CountUp value={centerValue} />
              </span>
            ) : centerValue ? (
              <span className="text-4xl font-bold tracking-tight text-ink" style={{ textShadow: '0 0 18px rgba(99,102,241,0.45)' }}>
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
  const series = Object.keys(rows[0]).filter(
    (k) => k !== 'name' && typeof rows[0][k] === 'number' && k !== '__typename',
  );

  const SERIES_COLORS: Array<{ key: string; color: string }> = [
    { key: 'Asistieron', color: '#10b981' },
    { key: 'Faltaron', color: '#f43f5e' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={rows} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
          <defs>
            {SERIES_COLORS.map(({ key, color }) => (
              <linearGradient key={key} id={`area-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                <stop offset="55%" stopColor={color} stopOpacity={0.12} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="4 8" stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} dy={6} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} allowDecimals={false} width={0} />
          <Tooltip content={<ChartTooltip metaKey="% Asistencia" metaLabel="Asistencia del día" />} />
          {SERIES_COLORS.filter((s) => series.includes(s.key)).map(({ key, color }) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#area-${key})`}
              dot={false}
              activeDot={{ r: 5, fill: color, stroke: '#0b0f1c', strokeWidth: 2 }}
              style={{ filter: `drop-shadow(0 0 8px ${hexToRgba(color, 0.55)})` }}
              animationDuration={700}
              animationEasing="ease-out"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function SegmentBar({ data, height = 14 }: { data: Array<{ name: string; value: number }>; height?: number }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (!total) return <NoData />;
  const segments = [
    ...data,
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex w-full overflow-hidden rounded-full"
      style={{ height, boxShadow: 'inset 0 0 8px rgba(0,0,0,0.35)' }}
    >
      {segments.map((segment, i) => {
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