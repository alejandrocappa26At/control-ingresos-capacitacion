import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  className?: string;
  barClassName?: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger';
}

const toneColors: Record<string, string> = {
  brand: 'gradient-brand',
  success: 'gradient-success',
  warning: 'gradient-warning',
  danger: 'gradient-danger',
};

const glowColors: Record<string, string> = {
  brand: 'shadow-[0_0_10px_rgba(227,6,19,0.6)]',
  success: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
  warning: 'shadow-[0_0_10px_rgba(245,158,11,0.5)]',
  danger: 'shadow-[0_0_10px_rgba(227,6,19,0.55)]',
};

export function Progress({ value, className, barClassName, tone = 'brand' }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-3', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-700 ease-out',
          toneColors[tone],
          glowColors[tone],
          barClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}