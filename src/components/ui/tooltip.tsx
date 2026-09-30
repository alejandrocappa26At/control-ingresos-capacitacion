'use client';

import * as React from 'react';
import { AnimatePresence, motion, type Target, type Transition } from 'framer-motion';
import { cn } from '@/lib/utils';

type Side = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: Side;
  className?: string;
  wrapperClassName?: string;
}

const OFFSET: Record<Side, string> = {
  top: 'bottom-full left-1/2 mb-2.5',
  bottom: 'top-full left-1/2 mt-2.5',
  left: 'right-full top-1/2 mr-2.5',
  right: 'left-full top-1/2 ml-2.5',
};

const HIDDEN: Record<Side, Target> = {
  top: { opacity: 0, scale: 0.92, x: '-50%', y: 8 },
  bottom: { opacity: 0, scale: 0.92, x: '-50%', y: -8 },
  left: { opacity: 0, scale: 0.92, x: 8, y: '-50%' },
  right: { opacity: 0, scale: 0.92, x: -8, y: '-50%' },
};

const VISIBLE: Record<Side, Target> = {
  top: { opacity: 1, scale: 1, x: '-50%', y: 0 },
  bottom: { opacity: 1, scale: 1, x: '-50%', y: 0 },
  left: { opacity: 1, scale: 1, x: 0, y: '-50%' },
  right: { opacity: 1, scale: 1, x: 0, y: '-50%' },
};

const TRANSITION: Transition = { duration: 0.22, ease: [0.16, 1, 0.3, 1] };

export function Tooltip({ content, children, side = 'top', className, wrapperClassName }: TooltipProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <span
      className={cn('relative inline-flex', wrapperClassName)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            key="tooltip"
            role="tooltip"
            initial={HIDDEN[side]}
            animate={VISIBLE[side]}
            exit={HIDDEN[side]}
            transition={TRANSITION}
            className={cn('glass-tip pointer-events-none absolute z-50', OFFSET[side], className)}
            aria-label={typeof content === 'string' ? content : undefined}
          >
            <span className="relative block px-2.5 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap text-ink">
              {content}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
