'use client';

import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';

type Tone = 'blue' | 'orange' | 'slate' | 'green' | 'rose' | 'emerald' | 'amber';

interface ToneConfig {
  color: string;
  glow: string;
  tile: string;
}

const toneConfig: Record<Tone, ToneConfig> = {
  blue: {
    color: '#2563eb',
    glow: 'rgba(37,99,235,0.35)',
    tile: 'border-[#2563eb]/25 bg-[#2563eb]/10 text-[#2563eb] shadow-[0_6px_20px_-8px_rgba(37,99,235,0.5)]',
  },
  orange: {
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.35)',
    tile: 'border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#f59e0b] shadow-[0_6px_20px_-8px_rgba(245,158,11,0.5)]',
  },
  slate: {
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.3)',
    tile: 'border-[#94a3b8]/25 bg-[#94a3b8]/10 text-[#94a3b8] shadow-[0_6px_20px_-8px_rgba(148,163,184,0.4)]',
  },
  green: {
    color: '#00d26a',
    glow: 'rgba(0,210,106,0.35)',
    tile: 'border-[#00d26a]/25 bg-[#00d26a]/10 text-[#00d26a] shadow-[0_6px_20px_-8px_rgba(0,210,106,0.5)]',
  },
  rose: {
    color: '#ff2d55',
    glow: 'rgba(255,45,85,0.35)',
    tile: 'border-[#ff2d55]/25 bg-[#ff2d55]/10 text-[#ff2d55] shadow-[0_6px_20px_-8px_rgba(255,45,85,0.5)]',
  },
  emerald: {
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.35)',
    tile: 'border-[#22c55e]/25 bg-[#22c55e]/10 text-[#22c55e] shadow-[0_6px_20px_-8px_rgba(34,197,94,0.5)]',
  },
  amber: {
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.35)',
    tile: 'border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#f59e0b] shadow-[0_6px_20px_-8px_rgba(245,158,11,0.5)]',
  },
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
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'blue',
  index = 0,
  format = 'number',
  suffix,
}: KpiCardProps) {
  const t = toneConfig[tone];
  const style = {
    borderLeftColor: t.color,
    '--kpi-accent': t.color,
    '--kpi-glow': t.glow,
  } as CSSProperties;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full"
    >
      <div
        style={style}
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line border-l-4 bg-surface-2 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.25),0_10px_24px_-14px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-[var(--kpi-accent)]/30 group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_16px_36px_-16px_var(--kpi-glow)]"
      >
        <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[var(--kpi-accent)] to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold leading-snug tracking-[0.14em] text-ink-muted uppercase">{title}</p>
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105',
              t.tile,
            )}
          >
            <Icon className="size-[18px]" />
          </span>
        </div>
        <p className="mt-3 text-3xl font-extrabold leading-none tracking-tight text-ink tabular-nums">
          <CountUp value={value} format={format} suffix={suffix} />
        </p>
        {subtitle && <p className="mt-1.5 text-[11px] font-medium text-ink-soft">{subtitle}</p>}
      </div>
    </motion.div>
  );
}