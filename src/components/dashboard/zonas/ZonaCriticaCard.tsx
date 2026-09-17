'use client';

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { CountUp } from '@/components/ui/count-up';
import { SEMAFORO_STYLES } from '@/services/analytics/reclutadores';
import type { ZonaDesercion } from '@/services/analytics/zonas';

export function ZonaCriticaCard({ data }: { data: ZonaDesercion | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full"
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/[0.14] via-rose-900/[0.07] to-transparent p-5 shadow-card backdrop-blur-xl transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_60px_-12px_rgba(227,6,19,0.55)]">
        <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-rose-500/25 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/50 to-transparent" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-rose-500/30 to-rose-500/5 text-rose-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <MapPin className="size-5 drop-shadow-[0_0_8px_currentColor]" />
            </span>
            <div>
              <p className="text-[10px] font-black tracking-widest text-rose-300 uppercase">🏆 Zona más crítica</p>
              <p className="mt-1 truncate text-2xl font-black tracking-tight text-ink" title={data?.zona ?? '—'}>
                {data?.zona ?? '—'}
              </p>
            </div>
          </div>
          {data && (
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs" title={SEMAFORO_STYLES[data.nivel].label}>
              {SEMAFORO_STYLES[data.nivel].emoji}
            </span>
          )}
        </div>

        {data ? (
          <div className="relative mt-4 grid grid-cols-3 gap-3">
            <Stat
              label="Deserciones"
              value={<CountUp value={data.deserciones} />}
              accent="text-rose-300"
            />
            <Stat
              label="Tasa de deserción"
              value={`${data.tasaDesercion.toFixed(1)}%`}
              accent="text-amber-300"
            />
            <Stat
              label="Participación"
              value={`${data.pctDelTotal.toFixed(1)}%`}
              accent="text-ink"
            />
          </div>
        ) : (
          <p className="relative mt-4 text-sm font-medium text-ink-soft">Sin deserciones registradas.</p>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-rose-500/60 via-pink-500/40 to-transparent" />
      </div>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[9px] font-bold tracking-wider text-ink-soft uppercase">{label}</p>
      <p className={`mt-1 text-lg leading-tight font-black tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}