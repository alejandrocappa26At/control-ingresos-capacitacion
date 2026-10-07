'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Search, Target, UserX } from 'lucide-react';
import { Modal, ModalClose } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { esAprobado, esCaidaCapacitacion, esDesercion, esEnCapacitacion, SEMAFORO_STYLES } from '@/services/analytics/reclutadores';
import type { ResumenReclutador } from '@/services/analytics/reclutadores';
import { cn, formatNumber, normalizeKey } from '@/lib/utils';
import type { Promotor } from '@/types';
import {
  BotonExportar,
  ModalKpi,
  RecordTable,
  avatarGradient,
  fold,
  initialsOf,
  useExportarRegistros,
} from '../shared/DetallePromotores';

type TabId = 'todos' | 'aprobados' | 'bajas' | 'desercion';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'todos', label: 'TODOS' },
  { id: 'aprobados', label: 'APROBADOS' },
  { id: 'bajas', label: 'BAJAS' },
  { id: 'desercion', label: 'DESERCIÓN' },
];

const EMPTY_COPY: Record<TabId, string> = {
  todos: 'Sin registros para este reclutador.',
  aprobados: 'Sin aprobados registrados.',
  bajas: 'Sin bajas durante capacitación.',
  desercion: 'Sin deserciones registradas.',
};

function matchTab(tab: TabId, r: Promotor): boolean {
  if (tab === 'todos') return true;
  if (tab === 'aprobados') return esAprobado(r);
  if (tab === 'bajas') return esCaidaCapacitacion(r);
  return esDesercion(r);
}

interface ReclutadorDetailModalProps {
  reclutador: string | null;
  resumen: ResumenReclutador | null;
  records: Promotor[];
  onClose: () => void;
  onSelectPromotor?: (p: Promotor) => void;
}

export function ReclutadorDetailModal({
  reclutador,
  resumen,
  records,
  onClose,
  onSelectPromotor,
}: ReclutadorDetailModalProps) {
  const [tab, setTab] = useState<TabId>('todos');
  const [query, setQuery] = useState('');
  const exportar = useExportarRegistros('reclutador');

  const propios = useMemo(() => {
    if (!reclutador) return [];
    // `responsable` ya viene normalizado desde analizarReclutadores.
    return records.filter((r) => normalizeKey(r.responsableAS) === reclutador);
  }, [records, reclutador]);

  const conteos = useMemo(() => {
    let aprobados = 0;
    let caidasCapacitacion = 0;
    let desercion = 0;
    let enCapacitacion = 0;
    for (const r of propios) {
      if (esAprobado(r)) aprobados += 1;
      else if (esCaidaCapacitacion(r)) caidasCapacitacion += 1;
      else if (esDesercion(r)) desercion += 1;
      else if (esEnCapacitacion(r)) enCapacitacion += 1;
    }
    return { todos: propios.length, aprobados, bajas: caidasCapacitacion, desercion, enCapacitacion };
  }, [propios]);

  const visibles = useMemo(() => {
    const q = fold(query);
    return propios.filter((r) => {
      if (!matchTab(tab, r)) return false;
      if (!q) return true;
      return fold(r.apellidosNombres).includes(q) || fold(r.dni).includes(q) || fold(r.nombreTienda).includes(q);
    });
  }, [propios, tab, query]);

  const calculado = useMemo(() => {
    const caidas = conteos.bajas + conteos.desercion;
    const permanenciaBase = conteos.aprobados + conteos.enCapacitacion;
    return {
      ingresos: propios.length,
      aprobados: conteos.aprobados,
      bajas: conteos.bajas,
      desercion: conteos.desercion,
      caidas,
      pctDesercion: propios.length > 0 ? (conteos.desercion / propios.length) * 100 : 0,
      pctPermanencia: propios.length > 0 ? (permanenciaBase / propios.length) * 100 : 0,
    };
  }, [propios, conteos]);

  if (!reclutador) return null;

  const [from, to] = avatarGradient(reclutador);
  const semaforo = resumen ? SEMAFORO_STYLES[resumen.nivel] : null;

  return (
    <Modal open onClose={onClose} fullscreen>
      <div className="relative shrink-0 overflow-hidden border-b border-line">
        <div className="bg-mesh absolute inset-0" />
        <div
          className="pointer-events-none absolute -top-24 -left-16 size-64 rounded-full opacity-25 blur-3xl"
          style={{ background: `radial-gradient(circle, ${from}, transparent 70%)` }}
        />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

        <div className="relative flex flex-wrap items-start gap-4 px-5 py-4 sm:px-7 sm:py-5">
          <motion.span
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-glow"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            {initialsOf(reclutador)}
          </motion.span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.14em] text-ink-muted uppercase">
              Desempeño del reclutador · responsable A&amp;S
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-lg font-bold tracking-tight text-ink">
              <Target className="size-4 shrink-0 text-brand-400" />
              {reclutador}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="brand" dot dotColor="bg-brand-500">
                {formatNumber(calculado.ingresos)} ingresos
              </Badge>
              {semaforo && (
                <Badge tone="neutral" className="border-transparent" style={{ background: `${semaforo.color}1A` }}>
                  <span className="text-[11px]">{semaforo.emoji}</span> Deserción{' '}
                  {calculado.pctDesercion.toFixed(1)}%
                </Badge>
              )}
              {resumen && (
                <Badge tone="neutral">
                  {resumen.pctDelTotal.toFixed(1)}% del total de ingresos
                </Badge>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <BotonExportar
              total={visibles.length}
              onExport={(formato) => void exportar(visibles, formato, reclutador)}
            />
            <ModalClose onClose={onClose} />
          </div>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-2.5 px-5 py-4 sm:grid-cols-2 lg:grid-cols-4 sm:px-7">
        <ModalKpi
          icon={<CheckCircle2 className="size-5" />}
          label="Aprobados"
          value={calculado.aprobados}
          hint={`${calculado.pctPermanencia.toFixed(1)}% de permanencia`}
          from="#047857"
          to="#10b981"
          solid="#34d399"
        />
        <ModalKpi
          icon={<AlertCircle className="size-5" />}
          label="Bajas durante capacitación"
          value={calculado.bajas}
          hint="TOTAL DE DÍAS ≥ 1 · no pasó"
          from="#c2410c"
          to="#f59e0b"
          solid="#fbbf24"
          delay={0.06}
        />
        <ModalKpi
          icon={<UserX className="size-5" />}
          label="Deserciones"
          value={calculado.desercion}
          hint={`${calculado.pctDesercion.toFixed(1)}% de sus ingresos`}
          from="#1e293b"
          to="#475569"
          solid="#94a3b8"
          delay={0.12}
        />
        <ModalKpi
          icon={<Target className="size-5" />}
          label="Total de caídas"
          value={calculado.caidas}
          hint="Deserciones + bajas durante capacitación"
          from="#b91c1c"
          to="#ef4444"
          solid="#f87171"
          delay={0.18}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 py-1">
            {TABS.map(({ id, label }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  aria-pressed={active}
                  className={cn(
                    'relative shrink-0 rounded-xl px-3 py-2 text-[11px] tracking-wide whitespace-nowrap transition-all duration-300 ease-out active:scale-[0.97] active:duration-150',
                    active
                      ? '-translate-y-px font-extrabold text-white'
                      : 'font-bold text-ink-soft hover:text-ink',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="reclutador-tab"
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 rounded-xl border border-[#1DB954]/45 bg-[linear-gradient(135deg,rgba(29,185,84,0.24),rgba(29,185,84,0.06))] shadow-[0_0_16px_-5px_rgba(29,185,84,0.8)]"
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {label}
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[10px] tabular-nums transition-colors duration-300',
                        active ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-ink/10',
                      )}
                    >
                      {formatNumber(conteos[id])}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por DNI, nombre o tienda"
              className="h-9 w-full rounded-xl border border-line bg-surface/60 pr-3 pl-9 text-xs text-ink transition-colors outline-none placeholder:text-ink-soft focus:border-brand-400/40 focus:bg-brand-500/[0.06]"
            />
          </div>
        </div>

        <p className="mt-2.5 mb-2.5 text-[11px] font-semibold text-ink-soft">
          Mostrando <span className="font-bold text-ink tabular-nums">{formatNumber(visibles.length)}</span> de{' '}
          <span className="font-bold tabular-nums">{formatNumber(propios.length)}</span> registros del reclutador
        </p>

        {visibles.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-soft">
            {query ? 'Sin resultados para la búsqueda.' : EMPTY_COPY[tab]}
          </p>
        ) : (
          <RecordTable rows={visibles} onSelect={onSelectPromotor} />
        )}
      </div>
    </Modal>
  );
}
