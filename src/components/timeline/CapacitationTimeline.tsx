'use client';

import { motion } from 'framer-motion';
import { UserPlus, GraduationCap, Flag, Truck, Trophy, XCircle, Pause, CalendarDays } from 'lucide-react';
import type { Promotor } from '@/types';
import { getAsistenciaEmoji } from '@/services/analytics/attendance';
import { cn } from '@/lib/utils';

interface TimelineStep {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: 'brand' | 'amber' | 'emerald' | 'rose' | 'slate';
}

const toneBg: Record<string, string> = {
  brand: 'from-brand-500/25 to-brand-500/5 text-brand-400',
  amber: 'from-amber-500/25 to-amber-500/5 text-amber-400',
  emerald: 'from-emerald-500/25 to-emerald-500/5 text-emerald-400',
  rose: 'from-rose-500/25 to-rose-500/5 text-rose-400',
  slate: 'from-slate-500/25 to-slate-500/5 text-slate-400',
};

export function CapacitationTimeline({ promotor }: { promotor: Promotor }) {
  const steps: TimelineStep[] = [
    {
      icon: <UserPlus className="size-4" />,
      title: 'Ingreso',
      subtitle: promotor.fechaIngreso === 'Pendiente' ? 'Pendiente' : promotor.fechaIngreso,
      tone: 'brand',
    },
    {
      icon: <GraduationCap className="size-4" />,
      title: 'Inicio capacitación',
      subtitle: promotor.inicioCapacitacion === 'Pendiente' ? 'Pendiente' : promotor.inicioCapacitacion,
      tone: 'brand',
    },
    ...promotor.asistencia.map((value, idx) => ({
      icon: <span className="text-xs">{getAsistenciaEmoji(value)}</span>,
      title: `Día ${idx + 1}`,
      subtitle:
        value === 1 ? 'Asistió' : value === 0 ? 'No asistió' : 'Sin registro',
      tone: value === 1 ? 'emerald' : value === 0 ? 'rose' : 'slate',
    })) as TimelineStep[],
    {
      icon: <Flag className="size-4" />,
      title: 'Fin capacitación',
      subtitle: promotor.finCapacitacion === 'Pendiente' ? 'Pendiente' : promotor.finCapacitacion,
      tone: 'brand',
    },
    {
      icon: <Truck className="size-4" />,
      title: 'Entrega operaciones',
      subtitle: promotor.entregaOperaciones,
      tone: 'brand',
    },
    {
      icon:
        promotor.resultado === 'APROBADO' ? (
          <Trophy className="size-4" />
        ) : promotor.resultado === 'NO_APROBADO' ? (
          <XCircle className="size-4" />
        ) : (
          <Pause className="size-4" />
        ),
      title: 'Resultado',
      subtitle:
        promotor.resultado === 'APROBADO'
          ? 'Pasa a operaciones'
          : promotor.resultado === 'NO_APROBADO'
            ? 'No pasa a operaciones'
            : 'Pendiente',
      tone: promotor.resultado === 'APROBADO' ? 'emerald' : promotor.resultado === 'NO_APROBADO' ? 'rose' : 'slate',
    },
  ];

  return (
    <div className="relative max-h-96 overflow-y-auto pr-2">
      {steps.map((step, i) => (
        <motion.div
          key={`${i}-${step.title}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="group relative flex gap-4 pb-5 last:pb-0"
        >
          {i < steps.length - 1 && (
            <span className="absolute top-7 left-[15px] h-full w-px bg-gradient-to-b from-line-2 via-line-2 to-transparent" />
          )}
          <div className={cn('z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-b shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-300 group-hover:scale-110', toneBg[step.tone])}>
            {step.icon}
          </div>
          <div className="pt-0.5">
            <p className="text-xs font-bold text-ink">{step.title}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted">
              <CalendarDays className="size-3 opacity-60" />
              {step.subtitle}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}