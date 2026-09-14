'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionTitle({ icon, title, subtitle, className }: SectionTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn('mb-4 flex items-center justify-between gap-3', className)}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] text-brand-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          {icon}
        </span>
        <div className="leading-tight">
          <h3 className="text-sm font-bold tracking-wide text-ink uppercase">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
        </div>
      </div>
    </motion.div>
  );
}