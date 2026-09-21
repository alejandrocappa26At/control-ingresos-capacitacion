import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

const tones: Record<BadgeTone, string> = {
  default: 'bg-surface-3 text-ink border-line',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
  info: 'bg-white/10 text-zinc-300 border-white/15',
  neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/25',
  brand: 'bg-brand-500/10 text-brand-300 border-brand-500/25',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
  dotColor?: string;
}

export function Badge({ className, tone = 'default', dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('size-1.5 rounded-full shadow-[0_0_6px_currentColor]', dotColor)} />}
      {children}
    </span>
  );
}