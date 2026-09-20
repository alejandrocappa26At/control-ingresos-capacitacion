'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';

type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'slate';

const toneIcon: Record<Tone, string> = {
  brand: 'text-brand-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
  slate: 'text-slate-600',
};

const toneSpark: Record<Tone, string> = {
  brand: '#2563eb',
  emerald: '#059669',
  amber: '#d97706',
  rose: '#e11d48',
  slate: '#64748b',
};

interface KpiCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  tone?: Tone;
  index?: number;
  format?: 'number' | 'percent';
  suffix?: string;
  spark?: number[];
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 240;
  const h = 64;
  const pad = 4;
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [
    pad + i * step,
    h - pad - ((v - min) / range) * (h - pad * 2),
  ]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${(w - pad).toFixed(1)} ${h} L${pad} ${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-16 w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${color.replace('#', '')})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
      <circle cx={last[0]} cy={last[1]} r="6" fill={color} opacity="0.18" />
    </svg>
  );
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'brand',
  index = 0,
  format = 'number',
  suffix,
  spark,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full"
    >
      <div className="flex h-full flex-col rounded-2xl border border-line bg-surface-2 p-6 shadow-[0_1px_3px_rgba(17,24,39,0.05),0_12px_30px_-18px_rgba(17,24,39,0.14)] transition-colors duration-300 group-hover:border-line-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-bold leading-snug tracking-[0.14em] text-ink-muted uppercase">{title}</p>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-3">
            <Icon className={cn('size-[18px]', toneIcon[tone])} />
          </span>
        </div>
        <p className="mt-4 text-4xl font-extrabold leading-none tracking-tight text-ink tabular-nums">
          <CountUp value={value} format={format} suffix={suffix} />
        </p>
        {subtitle && <p className="mt-3 text-xs font-medium text-ink-muted">{subtitle}</p>}
        {spark && spark.length >= 2 && (
          <div className="mt-4">
            <Sparkline data={spark} color={toneSpark[tone]} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
