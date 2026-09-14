import { LucideIcon, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  action?: React.ReactNode;
  tone?: 'brand' | 'neutral';
}

export function EmptyState({ title, description, icon: Icon = Inbox, className, action, tone = 'brand' }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-line-2 bg-surface/60 py-14 text-center',
        className,
      )}
    >
      <div
        className={cn(
          'flex size-14 items-center justify-center rounded-2xl',
          tone === 'brand'
            ? 'bg-gradient-to-b from-brand-500/15 to-brand-500/5 text-brand-400 shadow-glow-sm'
            : 'bg-surface-3 text-ink-soft',
        )}
      >
        <Icon className="size-7" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-ink">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}