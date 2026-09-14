import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-lg bg-surface-3',
        'bg-[linear-gradient(110deg,var(--surface-3)_45%,var(--line)_50%,var(--surface-3)_55%)]',
        'bg-[length:200%_100%]',
        className,
      )}
    />
  );
}

export function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface-2 p-5 shadow-card">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-9 w-20" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface-2 p-5 shadow-card', className)}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-4 h-52 w-full" />
    </div>
  );
}