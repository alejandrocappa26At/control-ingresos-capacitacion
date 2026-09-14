'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView, useMotionValue } from 'framer-motion';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface CountUpProps {
  value: number;
  format?: 'number' | 'percent';
  suffix?: string;
  duration?: number;
  className?: string;
}

export function CountUp({ value, format = 'number', suffix, duration = 1.1, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });
  const motionValue = useMotionValue(0);

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    const unsub = motionValue.on('change', (latest) => {
      if (!ref.current) return;
      const text =
        format === 'percent'
          ? `${latest.toFixed(1)}%`
          : `${formatNumber(Math.round(latest))}${suffix ? ` ${suffix}` : ''}`;
      ref.current.textContent = text;
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, value, duration, format, suffix, motionValue]);

  const initialText =
    format === 'percent' ? '0.0%' : `0${suffix ? ` ${suffix}` : ''}`;

  return (
    <span ref={ref} className={cn('tabular-nums', className)} suppressHydrationWarning>
      {initialText}
    </span>
  );
}