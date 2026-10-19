'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionTitle } from '@/components/common/SectionTitle';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import {
  INDICADORES_KPI,
  SEMAFORO_STYLES,
  type IndicadorKpiId,
  type NivelKpi,
} from '@/services/analytics/reclutadores';

/**
 * La guía se construye desde `INDICADORES_KPI` (fuente de verdad de nombres,
 * fórmulas, rangos, etiquetas y colores). Aquí solo se agrega documentación
 * complementaria visible únicamente en el modal de metodología.
 */
interface DocIndicador {
  emoji: string;
  /** Regla de clasificación del registro en el Excel (doc). */
  regla?: string[];
  /** Nota corta por nivel (doc: tooltip del chip + modal). */
  notas?: Partial<Record<NivelKpi, string>>;
}

const DOC: Record<IndicadorKpiId, DocIndicador> = {
  desercion: {
    emoji: '⚫',
    regla: ['TOTAL DE DÍAS = 0'],
    notas: {
      excelente: 'Pérdida mínima. Muy buen nivel de efectividad del proceso.',
      aceptable: 'Nivel controlado y razonable.',
      riesgo: 'Requiere revisar causas de deserción.',
      critico: 'Pérdida elevada. Requiere intervención inmediata.',
    },
  },
  baja: {
    emoji: '🟠',
    regla: ['TOTAL DE DÍAS >= 1', 'AND', 'PASA A OPERACIONES = 0'],
    notas: {
      excelente: 'Muy buena efectividad de capacitación.',
      aceptable: 'Dentro de lo esperado.',
      riesgo: 'Revisar causas de abandono o separación.',
      critico: 'Nivel alto de pérdida durante capacitación.',
    },
  },
  conversion: {
    emoji: '🟢',
    regla: ['TOTAL DE DÍAS >= 1', 'AND', 'PASA A OPERACIONES = 1'],
    notas: {
      excelente: 'Excelente conversión. Reclutamiento de alta calidad.',
      aceptable: 'Conversión dentro de lo esperado.',
      riesgo: 'Revisar calidad del ingreso a capacitación.',
      critico: 'Conversión muy baja. Requiere intervención inmediata.',
    },
  },
  permanencia: { emoji: '✅' },
};

const INDICADORES = (Object.keys(INDICADORES_KPI) as IndicadorKpiId[]).map((id) => ({
  id,
  cfg: INDICADORES_KPI[id],
  doc: DOC[id],
}));

function RangoChip({ nombre, nivel, rango, nota }: {
  nombre: string;
  nivel: NivelKpi;
  rango: string;
  nota?: string;
}) {
  const s = SEMAFORO_STYLES[nivel];
  return (
    <span
      title={`${nombre}: ${s.label} (${rango})${nota ? ` — ${nota}` : ''}`}
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap tabular-nums"
      style={{ borderColor: `${s.color}55`, background: `${s.color}1A`, color: s.color }}
    >
      <span className="leading-none">{s.emoji}</span>
      {s.label} · {rango}
    </span>
  );
}

function TarjetaIndicador({ cfg, doc, index }: {
  cfg: (typeof INDICADORES)[number]['cfg'];
  doc: DocIndicador;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-surface-2 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.25),0_8px_24px_-12px_rgba(0,0,0,0.5)]"
    >
      <p className="flex items-center gap-2 text-[11px] font-bold tracking-wider text-ink uppercase">
        <span className="text-sm leading-none">{doc.emoji}</span>
        {cfg.nombre}
      </p>

      <code className="block rounded-lg border border-line bg-surface-3/60 px-2 py-1 text-center text-[10px] font-semibold text-ink">
        {cfg.formula}
      </code>

      <div className="mt-auto flex flex-wrap gap-1.5">
        {cfg.niveles.map((rango) => (
          <RangoChip
            key={rango.nivel}
            nombre={cfg.nombre}
            nivel={rango.nivel}
            rango={rango.rango}
            nota={doc.notas?.[rango.nivel]}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function GuiaInterpretacionIndicadores() {
  const [metodologiaAbierta, setMetodologiaAbierta] = useState(false);

  return (
    <div data-testid="guia-indicadores">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SectionTitle
          icon={<BookOpen className="size-4" />}
          title="Guía de interpretación de indicadores"
          subtitle="Fórmula resumida y rangos de clasificación de cada métrica"
          className="mb-0"
        />
        <Button variant="outline" size="sm" onClick={() => setMetodologiaAbierta(true)}>
          <ClipboardList className="size-3.5" />
          VER METODOLOGÍA KPI
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {INDICADORES.map(({ id, cfg, doc }, i) => (
          <TarjetaIndicador key={id} cfg={cfg} doc={doc} index={i} />
        ))}
      </div>

      <Modal
        open={metodologiaAbierta}
        onClose={() => setMetodologiaAbierta(false)}
        title="Metodología de los indicadores"
        className="max-w-2xl"
      >
        <div className="max-h-[72vh] overflow-y-auto px-6 py-4 sm:px-7">
          {INDICADORES.map(({ id, cfg, doc }) => (
            <section key={id} className="border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0">
              <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-ink uppercase">
                <span>{doc.emoji}</span>
                {cfg.nombre}
              </p>
              <p className="mt-1 text-[11px] text-ink-muted">Qué mide: {cfg.descripcion}</p>

              {doc.regla && (
                <div className="mt-2 flex flex-col gap-0.5 rounded-lg border border-line bg-surface-3/60 px-2 py-1.5">
                  {doc.regla.map((linea) => (
                    <code
                      key={linea}
                      className={cn(
                        'block text-[10px] font-semibold tabular-nums',
                        linea === 'AND' ? 'text-center text-ink-soft' : 'text-ink',
                      )}
                    >
                      {linea}
                    </code>
                  ))}
                </div>
              )}

              <ul className="mt-2 space-y-1">
                {cfg.niveles.map((rango) => {
                  const s = SEMAFORO_STYLES[rango.nivel];
                  return (
                    <li key={rango.nivel} className="flex flex-wrap items-baseline gap-x-1.5 text-[11px] leading-snug">
                      <span className="font-bold whitespace-nowrap tabular-nums" style={{ color: s.color }}>
                        {s.emoji} {s.label} · {rango.rango}
                      </span>
                      {doc.notas?.[rango.nivel] && <span className="text-ink-muted">{doc.notas[rango.nivel]}</span>}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </Modal>
    </div>
  );
}
