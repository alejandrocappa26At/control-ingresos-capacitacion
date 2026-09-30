'use client';

import { motion } from 'framer-motion';
import {
  CalendarDays,
  Users,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  UserX,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import { CountUp } from '@/components/ui/count-up';
import { formatNumber } from '@/lib/utils';

export interface PeriodoCifras {
  ingresos: number;
  inician: number;
  aprobados: number;
  bajas: number;
  desercion: number;
  enCapacitacion: number;
}

interface PeriodoHeaderProps {
  periodo: string;
  global: PeriodoCifras;
  seleccion: (PeriodoCifras & { etiqueta: string }) | null;
}

const STATS: Array<{ key: keyof PeriodoCifras; label: string; icon: LucideIcon; color: string }> = [
  { key: 'ingresos', label: 'Total Ingresos', icon: Users, color: '#3b82f6' },
  { key: 'inician', label: 'Inician Capacitación', icon: PlayCircle, color: '#38bdf8' },
  { key: 'aprobados', label: 'Aprobados', icon: CheckCircle2, color: '#10b981' },
  { key: 'bajas', label: 'Baja en capacitación', icon: AlertCircle, color: '#f97316' },
  { key: 'desercion', label: 'Deserción', icon: UserX, color: '#71717a' },
  { key: 'enCapacitacion', label: 'En Capacitación', icon: GraduationCap, color: '#FACC15' },
];

export function PeriodoHeader({ periodo, global, seleccion }: PeriodoHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card"
    >
      <div className="bg-mesh pointer-events-none absolute inset-0 opacity-70" />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

      <div className="relative flex flex-wrap items-center gap-3 px-4 pt-4 pb-3.5 sm:px-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] text-brand-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <CalendarDays className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-[0.14em] text-ink-muted uppercase">Período Analizado</p>
          <p className="mt-0.5 text-lg leading-tight font-extrabold tracking-tight text-ink sm:text-xl">{periodo}</p>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-2 px-4 pb-3.5 sm:grid-cols-3 sm:px-5 xl:grid-cols-6">
        {STATS.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-surface/50 px-3 py-2.5 transition-colors duration-300 hover:bg-surface-3/50"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border"
              style={{ borderColor: `${color}47`, background: `${color}1f`, color }}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-lg leading-none font-bold tabular-nums text-ink">
                <CountUp value={global[key]} />
              </p>
              <p className="mt-1 truncate text-[9px] font-bold tracking-[0.08em] text-ink-soft uppercase" title={label}>
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {seleccion && (
        <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line/80 bg-brand-500/[0.04] px-4 py-2.5 sm:px-5">
          <p className="min-w-0 truncate text-[11px] font-semibold text-ink-soft">
            Selección <span className="font-bold text-brand-400">{seleccion.etiqueta}</span>
          </p>
          <p className="text-[11px] font-semibold tabular-nums text-ink-muted">
            <span className="text-ink">{formatNumber(seleccion.ingresos)}</span> ingresos ·{' '}
            <span className="text-ink">{formatNumber(seleccion.inician)}</span> iniciaron ·{' '}
            <span className="text-emerald-400">{formatNumber(seleccion.aprobados)}</span> aprobados ·{' '}
            <span className="text-amber-400">{formatNumber(seleccion.bajas)}</span> bajas ·{' '}
            <span className="text-zinc-400">{formatNumber(seleccion.desercion)}</span> deserciones ·{' '}
            <span className="text-yellow-300">{formatNumber(seleccion.enCapacitacion)}</span> en capacitación
          </p>
        </div>
      )}
    </motion.div>
  );
}
