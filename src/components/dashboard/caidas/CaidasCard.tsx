'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CaidasCardProps {
  icon: LucideIcon;
  iconClass?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  index?: number;
}

export function CaidasCard({ icon: Icon, iconClass, title, subtitle, children, className, index = 0 }: CaidasCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-line bg-surface-2 p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-rose',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(620px_280px_at_18%_-14%,rgba(244,63,94,0.14),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-rose-500/50 via-pink-500/40 to-transparent" />

      <div className="relative mb-4 flex items-center gap-2.5">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
            iconClass ?? 'from-rose-500/25 to-rose-500/5 text-rose-400',
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-bold tracking-wide text-ink uppercase">{title}</p>
          {subtitle && <p className="truncate text-xs text-ink-soft">{subtitle}</p>}
        </div>
      </div>

      <div className="relative">{children}</div>
    </motion.div>
  );
}