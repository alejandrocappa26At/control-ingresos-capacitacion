'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  return (
    <div className="group/tip relative inline-flex">
      {children}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: side === 'top' ? 4 : side === 'bottom' ? -4 : 0 }}
        whileHover={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          'glass-strong pointer-events-none absolute z-50 whitespace-nowrap rounded-lg border border-line/80 px-2.5 py-1.5 text-xs font-medium text-ink opacity-0 shadow-glow-sm transition-all duration-200 scale-90 group-hover/tip:scale-100 group-hover/tip:opacity-100',
          side === 'top' && 'bottom-full left-1/2 mb-2 -translate-x-1/2',
          side === 'bottom' && 'top-full left-1/2 mt-2 -translate-x-1/2',
          side === 'left' && 'right-full top-1/2 mr-2 -translate-y-1/2',
          side === 'right' && 'left-full top-1/2 ml-2 -translate-y-1/2',
          className,
        )}
        role="tooltip"
        aria-label={typeof content === 'string' ? content : undefined}
      >
        {content}
      </motion.div>
    </div>
  );
}