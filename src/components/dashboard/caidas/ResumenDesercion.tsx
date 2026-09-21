'use client';

import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { DesercionAnalisis } from '@/services/analytics/desercion';
import { DesercionKpis } from './DesercionKpis';
import { TendenciaIngresosDeserciones } from './TendenciaIngresosDeserciones';

export function ResumenDesercion({ data }: { data: DesercionAnalisis }) {
  return (
    <section className="mt-6 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl gradient-brand text-white shadow-[0_0_20px_rgba(227,6,19,0.45)]">
              <BarChart3 className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-red-400 ring-2 ring-canvas" />
            </span>
            <div className="leading-tight">
              <h3 className="text-sm font-black tracking-wide uppercase">
                <span className="gradient-text">Resumen Ejecutivo de Deserción</span>
              </h3>
              <p className="mt-0.5 text-xs text-ink-soft">
                PASA A OPERACIONES = No con TOTAL DE DÍAS = 0 (nunca asistieron)
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 shadow-[0_0_16px_-6px_rgba(227,6,19,0.6)]">
            {formatNumber(data.totalDeserciones)} deserciones en el periodo
          </span>
        </div>
      </motion.div>

      <DesercionKpis data={data} />

      <TendenciaIngresosDeserciones data={data.tendencia} />
    </section>
  );
}