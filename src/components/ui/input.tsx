import * as React from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-ink placeholder:text-ink-soft transition-all duration-300 focus:border-brand-400/70 focus:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'relative h-10 w-full cursor-pointer appearance-none rounded-xl border border-line bg-surface/60 px-3.5 pr-9 text-sm font-medium text-ink transition-all duration-300 focus:border-brand-400/70 focus:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:opacity-50',
        'bg-[url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%2394a3b8%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M4.5%206l3.5%203.5%203.5-3.5%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E")] bg-[position:right_12px_center] bg-no-repeat',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted', className)}
      {...props}
    />
  );
}