'use client';

import { useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlertTriangle, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';
import type { DesercionAnalisis } from '@/services/analytics/desercion';

const RED_GRADIENT = 'linear-gradient(135deg,#ff4d4f 0%,#e30613 55%,#b3081c 100%)';
const RED_GLOW = 'rgba(227,6,19,0.5)';

function RingGauge({ tasa, size = 176 }: { tasa: number; size?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const stroke = 15;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = (1 - tasa / 100) * c;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg ref={ref} width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="tasaRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4d4f" />
            <stop offset="100%" stopColor="#d90429" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#tasaRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={inView ? { strokeDashoffset: offset } : {}}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 10px ${RED_GLOW})` }}
        />
      </svg>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <span className="text-[9px] font-black tracking-widest text-ink-soft uppercase">Tasa</span>
        <span className="text-4xl font-black tracking-tight text-ink tabular-nums">
          <CountUp value={tasa} format="percent" duration={1.3} />
        </span>
        <span className="mt-1 text-[10px] font-bold text-ink-soft">de deserción</span>
      </motion.div>
    </div>
  );
}

export function TasaDesercionPremium({ data }: { data: DesercionAnalisis }) {
  const delta = useMemo(() => {
    const t = data.tendencia;
    if (t.length < 2) return null;
    const prev = [...t].filter((x) => x.ingresos > 0);
    if (prev.length < 2) return null;
    const last = prev[prev.length - 1];
    const pen = prev[prev.length - 2];
    return last.tasa - pen.tasa;
  }, [data.tendencia]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div
        className="relative overflow-hidden rounded-3xl p-px transition-all duration-300 group-hover:-translate-y-1"
        style={{ background: `linear-gradient(165deg,${RED_GLOW},rgba(255,255,255,0.06) 45%,${RED_GLOW})` }}
      >
        <div className="relative rounded-[calc(1.5rem-1px)] bg-surface-2/80 p-5 pt-6 backdrop-blur-xl">
          <div
            className="pointer-events-none absolute -top-24 right-0 size-48 rounded-full blur-3xl"
            style={{ background: RED_GRADIENT, opacity: 0.18 }}
          />
          <p className="text-[10px] font-black tracking-widest text-red-400 uppercase">Tasa de deserción</p>

          <div className="mt-4 flex items-center justify-center">
            <RingGauge tasa={data.tasaDesercion} />
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-line bg-surface-3/60 px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-ink-soft uppercase">
                <Users className="size-3" /> Ingresos
              </p>
              <p className="mt-0.5 text-xl font-black text-ink tabular-nums">
                {formatNumber(data.totalIngresos)}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface-3/60 px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider text-red-400/80 uppercase">
                <AlertTriangle className="size-3" /> Deserciones
              </p>
              <p className="mt-0.5 text-xl font-black text-ink tabular-nums">
                {formatNumber(data.totalDeserciones)}
              </p>
            </div>
          </div>

          <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <span className="text-[11px] font-bold text-ink-soft">
              {data.totalIngresos} ingresos · {data.totalDeserciones} nunca asistieron
            </span>
            {delta !== null && (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black tabular-nums',
                  delta >= 0
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                )}
              >
                {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {delta >= 0 ? '+' : ''}
                {delta.toFixed(1)} pts vs mes prev
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
