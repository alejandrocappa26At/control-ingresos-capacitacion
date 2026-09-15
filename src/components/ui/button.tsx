import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type Variant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'brand';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  default:
    'bg-brand-500 text-white shadow-[0_10px_30px_-10px_rgba(227,6,19,0.6)] hover:bg-brand-600 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-glow',
  brand:
    'gradient-brand text-white shadow-glow hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-glow-lg',
  secondary:
    'border border-brand-500/40 bg-surface-2 text-white hover:border-brand-400/70 hover:bg-brand-500/10 hover:text-brand-300 hover:shadow-glow-sm',
  outline:
    'border border-line bg-surface/40 text-ink backdrop-blur transition-all duration-300 hover:border-brand-500/50 hover:bg-brand-500/10 hover:text-brand-200 hover:shadow-glow-sm',
  ghost: 'bg-transparent hover:bg-surface-3 text-ink-muted hover:text-ink',
  destructive: 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-glow-rose',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-glow-emerald',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-sm rounded-xl gap-2',
  icon: 'h-10 w-10 rounded-xl',
};

export function Button({
  className,
  variant = 'default',
  size = 'md',
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-300 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}