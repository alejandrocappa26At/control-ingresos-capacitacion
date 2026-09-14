'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  toolbar?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
  contentClassName?: string;
}

export function ChartCard({
  title,
  description,
  icon,
  className,
  toolbar,
  loading,
  children,
  contentClassName,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group h-full"
    >
      <Card className={cn('h-full overflow-hidden transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-glow', className)}>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] text-brand-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                {icon}
              </span>
            )}
            <div>
              <CardTitle className="text-sm tracking-tight">{title}</CardTitle>
              {description && <p className="mt-0.5 text-xs text-ink-soft">{description}</p>}
            </div>
          </div>
          {toolbar && <div className="shrink-0">{toolbar}</div>}
        </CardHeader>
        <CardContent className={cn('pt-2', contentClassName)}>
          {loading ? <Skeleton className="h-64 w-full" /> : children}
        </CardContent>
      </Card>
    </motion.div>
  );
}