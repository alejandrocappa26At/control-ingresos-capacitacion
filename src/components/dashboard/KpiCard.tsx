'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';

type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate';

const toneStyles: Record<
  Tone,
  { icon: string; glow: string; bar: string; orb: string; ring: string }
> = {
  brand: {
    icon: 'text-brand-200',
    glow: 'group-hover:shadow-[0_16px_70px_-12px_rgba(227,6,19,0.55)]',
    bar: 'from-brand-500 via-brand-400 to-brand-700',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(227,6,19,0.42),transparent_65%)]',
    ring: 'group-hover:ring-brand-500/30',
  },
  emerald: {
    icon: 'text-emerald-400',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(34,197,94,0.45)]',
    bar: 'from-emerald-500 via-emerald-400 to-teal-500',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.4),transparent_65%)]',
    ring: 'group-hover:ring-emerald-500/25',
  },
  amber: {
    icon: 'text-amber-400',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(245,158,11,0.4)]',
    bar: 'from-amber-500 via-orange-400 to-rose-500',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.36),transparent_65%)]',
    ring: 'group-hover:ring-amber-500/25',
  },
  rose: {
    icon: 'text-rose-400',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(227,6,19,0.5)]',
    bar: 'from-rose-500 via-[#ff2735] to-brand-600',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(227,6,19,0.45),transparent_65%)]',
    ring: 'group-hover:ring-rose-500/25',
  },
  sky: {
    icon: 'text-zinc-200',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(255,255,255,0.22)]',
    bar: 'from-white/80 via-zinc-300 to-zinc-500',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_65%)]',
    ring: 'group-hover:ring-white/20',
  },
  violet: {
    icon: 'text-[#ff8b8f]',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(160,4,13,0.5)]',
    bar: 'from-[#ff2735] via-[#e30613] to-[#6b030a]',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(160,4,13,0.42),transparent_65%)]',
    ring: 'group-hover:ring-[#ff2735]/25',
  },
  slate: {
    icon: 'text-zinc-400',
    glow: 'group-hover:shadow-[0_16px_60px_-12px_rgba(161,161,170,0.4)]',
    bar: 'from-zinc-400 via-zinc-300 to-zinc-600',
    orb: 'bg-[radial-gradient(circle_at_30%_20%,rgba(161,161,170,0.3),transparent_65%)]',
    ring: 'group-hover:ring-zinc-400/25',
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
      <div className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-card ring-1 ring-transparent transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.02] group-hover:border-white/15',
        styles.ring,
      )}>
        <div className={cn('pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100', styles.orb)} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff2735]/60 to-transparent" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-ink-soft uppercase">
              <span className="h-1 w-3 rounded-full gradient-brand" />
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_20px_rgba(227,6,19,0.35)]">
              <CountUp value={value} format={format} suffix={suffix} />
            </p>
            {subtitle && <p className="mt-1.5 text-[11px] font-medium text-ink-muted">{subtitle}</p>}
          </div>
          <div className={cn(
            'relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-white/12 to-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
            tone === 'brand' && 'shadow-[0_0_20px_-4px_rgba(227,6,19,0.6)]',
          )}>
            <Icon className={cn('size-5 drop-shadow-[0_0_8px_currentColor] transition-transform duration-300 group-hover:scale-110', styles.icon)} />
          </div>
        </div>

        <div className={cn('absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r opacity-70 transition-opacity duration-300 group-hover:opacity-100', styles.bar)} />
        <div className={cn('absolute inset-0 rounded-2xl transition-all duration-300 ease-out pointer-events-none', styles.glow)} />
      </div>
    </motion.div>
  );
}