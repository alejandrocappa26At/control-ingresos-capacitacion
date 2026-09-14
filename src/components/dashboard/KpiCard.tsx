'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';

type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate';

const toneStyles: Record<
  Tone,
  { icon: string; glow: string; bar: string; orb: string }
> = {
  brand: {
    icon: 'text-brand-300',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(99,102,241,0.45)]',
    bar: 'from-brand-500 via-indigo-400 to-cyan-500',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.5),transparent_65%)]',
  },
  emerald: {
    icon: 'text-emerald-400',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(16,185,129,0.45)]',
    bar: 'from-emerald-500 via-teal-400 to-cyan-500',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.45),transparent_65%)]',
  },
  amber: {
    icon: 'text-amber-400',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(245,158,11,0.4)]',
    bar: 'from-amber-500 via-orange-400 to-rose-500',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.4),transparent_65%)]',
  },
  rose: {
    icon: 'text-rose-400',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(239,68,68,0.4)]',
    bar: 'from-rose-500 via-pink-400 to-fuchsia-500',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.4),transparent_65%)]',
  },
  sky: {
    icon: 'text-cyan-400',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(6,182,212,0.4)]',
    bar: 'from-cyan-500 via-sky-400 to-brand-400',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.4),transparent_65%)]',
  },
  violet: {
    icon: 'text-violet-400',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(139,92,246,0.4)]',
    bar: 'from-violet-500 via-purple-400 to-brand-500',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.42),transparent_65%)]',
  },
  slate: {
    icon: 'text-slate-400',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(148,163,184,0.4)]',
    bar: 'from-slate-400 via-slate-300 to-slate-500',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(148,163,184,0.35),transparent_65%)]',
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
  tone = 'brand',
  index = 0,
  format = 'number',
  suffix,
}: KpiCardProps) {
  const styles = toneStyles[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.03]">
        <div className={cn('pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100', styles.orb)} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider text-ink-soft uppercase">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-ink">
              <CountUp value={value} format={format} suffix={suffix} />
            </p>
            {subtitle && <p className="mt-1.5 text-[11px] font-medium text-ink-soft">{subtitle}</p>}
          </div>
          <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Icon className={cn('size-5 drop-shadow-[0_0_8px_currentColor] transition-transform duration-300 group-hover:scale-110', styles.icon)} />
          </div>
        </div>

        <div className={cn('absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r opacity-70 transition-opacity duration-300 group-hover:opacity-100', styles.bar)} />
        <div className={cn('absolute inset-0 rounded-2xl transition-all duration-300 ease-out pointer-events-none', styles.glow)} />
      </div>
    </motion.div>
  );
}