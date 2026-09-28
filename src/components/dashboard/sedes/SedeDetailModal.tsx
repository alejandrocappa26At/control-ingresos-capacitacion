'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  UserX,
  GraduationCap,
  TrendingUp,
  FileSpreadsheet,
  FileDown,
  Search,
  MapPin,
  ChevronRight,
  UserMinus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal, ModalClose } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CountUp } from '@/components/ui/count-up';
import {
  esAprobado,
  esBajaCapacitacion,
  esDesercion,
  esEnCapacitacion,
} from '@/services/analytics/desercionBase';
import { cn, formatNumber, normalizeKey } from '@/lib/utils';
import { ESTADO_DOT, ESTADO_LABELS } from '@/lib/constants';
import type { Promotor } from '@/types';

type TabId = 'todos' | 'aprobados' | 'bajas' | 'desercion' | 'enCapacitacion';

const TABS: Array<{ id: TabId; label: string; color: string }> = [
  { id: 'todos', label: 'TODOS', color: '#94a3b8' },
  { id: 'aprobados', label: 'APROBADOS', color: '#10b981' },
  { id: 'bajas', label: 'BAJAS', color: '#f97316' },
  { id: 'desercion', label: 'DESERCIÓN', color: '#71717a' },
  { id: 'enCapacitacion', label: 'EN CAPACITACIÓN', color: '#eab308' },
];

const EMPTY_COPY: Record<TabId, string> = {
  todos: 'Sin registros para esta sede.',
  aprobados: 'Sin aprobados registrados.',
  bajas: 'Sin bajas durante capacitación.',
  desercion: 'Sin deserciones registradas.',
  enCapacitacion: 'Sin registros activos en capacitación.',
};

const AVATAR_GRADIENTS: Array<[string, string]> = [
  ['#e30613', '#ff3b47'],
  ['#2563eb', '#60a5fa'],
  ['#7c3aed', '#a855f7'],
  ['#0891b2', '#67e8f9'],
  ['#059669', '#34d399'],
  ['#d97706', '#fbbf24'],
];

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('') || '—'
  );
}

function fold(value: string): string {
  return normalizeKey(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function slug(value: string): string {
  return (
    fold(value)
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'SEDE'
  );
}

function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function matchTab(tab: TabId, r: Promotor): boolean {
  if (tab === 'todos') return true;
  if (tab === 'aprobados') return esAprobado(r);
  if (tab === 'bajas') return esBajaCapacitacion(r);
  if (tab === 'desercion') return esDesercion(r);
  return esEnCapacitacion(r);
}

interface SedeDetailModalProps {
  sede: string | null;
  records: Promotor[];
  onClose: () => void;
  onSelectPromotor: (p: Promotor) => void;
}

export function SedeDetailModal({ sede, records, onClose, onSelectPromotor }: SedeDetailModalProps) {
  const [tab, setTab] = useState<TabId>('todos');
  const [query, setQuery] = useState('');

  const propios = useMemo(() => {
    if (!sede) return [];
    const target = normalizeKey(sede);
    return records.filter((r) => normalizeKey(r.sede) === target);
  }, [records, sede]);

  const conteos = useMemo(() => {
    const base: Record<TabId, number> = {
      todos: propios.length,
      aprobados: 0,
      bajas: 0,
      desercion: 0,
      enCapacitacion: 0,
    };
    for (const r of propios) {
      if (esAprobado(r)) base.aprobados += 1;
      else if (esBajaCapacitacion(r)) base.bajas += 1;
      else if (esDesercion(r)) base.desercion += 1;
      else if (esEnCapacitacion(r)) base.enCapacitacion += 1;
    }
    return base;
  }, [propios]);

  const visibles = useMemo(() => {
    const q = fold(query);
    return propios.filter((r) => {
      if (!matchTab(tab, r)) return false;
      if (!q) return true;
      return (
        fold(r.apellidosNombres).includes(q) ||
        fold(r.dni).includes(q) ||
        fold(r.supervisor).includes(q) ||
        fold(r.responsableAS).includes(q) ||
        fold(r.capacitador).includes(q)
      );
    });
  }, [propios, tab, query]);

  const resumen = useMemo(() => {
    const inician = conteos.aprobados + conteos.bajas + conteos.enCapacitacion;
    return {
      ingresos: propios.length,
      lima: propios.filter((r) => r.jurisdiccion === 'LIMA').length,
      provincia: propios.filter((r) => r.jurisdiccion !== 'LIMA').length,
      inician,
      aprobados: conteos.aprobados,
      bajas: conteos.bajas,
      desercion: conteos.desercion,
      enCapacitacion: conteos.enCapacitacion,
      totalCaidas: conteos.bajas + conteos.desercion,
      pctAprobacion: inician > 0 ? (conteos.aprobados / inician) * 100 : 0,
      pctDelTotal: records.length > 0 ? (propios.length / records.length) * 100 : 0,
    };
  }, [propios, conteos, records.length]);

  const exportar = useCallback(
    async (formato: 'xlsx' | 'csv') => {
      if (visibles.length === 0) return;
      const fileName = `sede_${slug(sede ?? '')}_${stamp()}.${formato}`;
      try {
        const { exportExcel, exportCSV } = await import('@/services/export/exporter');
        if (formato === 'xlsx') exportExcel(visibles, fileName);
        else exportCSV(visibles, fileName);
        toast.success(`Reporte ${formato.toUpperCase()} generado (${formatNumber(visibles.length)} registros)`);
      } catch (error) {
        console.error('[SedeDetailModal] no se pudo exportar:', error);
        toast.error('No se pudo generar el reporte. Inténtalo de nuevo.');
      }
    },
    [visibles, sede],
  );

  if (!sede) return null;

  const [from, to] = AVATAR_GRADIENTS[(sede.length + sede.charCodeAt(0)) % AVATAR_GRADIENTS.length];

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
            {initialsOf(sede)}
          </motion.span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.14em] text-ink-muted uppercase">
              Detalle por sede
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-lg font-bold tracking-tight text-ink">
              <MapPin className="size-4 shrink-0 text-brand-400" />
              {sede}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="brand" dot dotColor="bg-brand-500">
                {formatNumber(resumen.ingresos)} registros
              </Badge>
              <Badge tone="info">{resumen.pctDelTotal.toFixed(1)}% del total filtrado</Badge>
              <Badge tone="neutral">{formatNumber(resumen.inician)} iniciaron</Badge>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="brand" size="sm" disabled={visibles.length === 0} onClick={() => void exportar('xlsx')}>
              <FileSpreadsheet className="size-4" />
              EXCEL ({formatNumber(visibles.length)})
            </Button>
            <Button variant="outline" size="sm" disabled={visibles.length === 0} onClick={() => void exportar('csv')}>
              <FileDown className="size-4" />
              CSV
            </Button>
            <ModalClose onClose={onClose} />
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-2.5 px-5 py-4 sm:px-7">
        <div className="grid grid-cols-2 gap-2.5">
          <SedeKpi
            icon={<Users className="size-5" />}
            label="Total Ingresos"
            value={resumen.ingresos}
            hint={`${formatNumber(resumen.lima)} Lima · ${formatNumber(resumen.provincia)} Provincia`}
            from="#1d4ed8"
            to="#3b82f6"
            solid="#60a5fa"
            delay={0}
          />
          <SedeKpi
            icon={<UserX className="size-5" />}
            label="Total Caídas"
            value={resumen.totalCaidas}
            hint={`${formatNumber(resumen.bajas)} bajas · ${formatNumber(resumen.desercion)} deserciones`}
            from="#b91c1c"
            to="#ef4444"
            solid="#f87171"
            delay={0.05}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <SedeKpi
            icon={<GraduationCap className="size-5" />}
            label="Inician Capacitación"
            value={resumen.inician}
            hint="TOTAL DE DÍAS ≥ 1"
            from="#6d28d9"
            to="#8b5cf6"
            solid="#a78bfa"
            delay={0.1}
          />
          <SedeKpi
            icon={<CheckCircle2 className="size-5" />}
            label="Aprobados"
            value={resumen.aprobados}
            hint="Pasan a Operaciones"
            from="#047857"
            to="#10b981"
            solid="#34d399"
            delay={0.15}
          />
          <SedeKpi
            icon={<AlertCircle className="size-5" />}
            label="Bajas Durante Capacitación"
            value={resumen.bajas}
            hint="Asistieron y no pasaron"
            from="#c2410c"
            to="#f97316"
            solid="#fb923c"
            delay={0.2}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <SedeKpi
            icon={<UserMinus className="size-5" />}
            label="Deserción"
            value={resumen.desercion}
            hint="Nunca inició capacitación"
            from="#1e293b"
            to="#475569"
            solid="#94a3b8"
            delay={0.25}
          />
          <SedeKpi
            icon={<TrendingUp className="size-5" />}
            label="% Aprobación"
            value={resumen.pctAprobacion}
            percent
            hint={`${formatNumber(resumen.aprobados)} de ${formatNumber(resumen.inician)} que iniciaron`}
            from="#059669"
            to="#22c55e"
            solid="#4ade80"
            delay={0.3}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {TABS.map(({ id, label, color }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  aria-pressed={active}
                  className={cn(
                    'relative shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold tracking-wide whitespace-nowrap transition-colors duration-300',
                    active ? 'text-ink' : 'text-ink-soft hover:text-ink',
                  )}
                  style={active ? { background: `${color}1f`, color } : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="sede-tab"
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 rounded-xl border"
                      style={{ borderColor: `${color}47` }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {label}
                    <span className="rounded-md bg-ink/10 px-1.5 py-0.5 text-[10px] tabular-nums">
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
              placeholder="Buscar DNI, nombre, supervisor o capacitador"
              className="h-9 w-full rounded-xl border border-line bg-surface/60 pr-3 pl-9 text-xs text-ink transition-colors outline-none placeholder:text-ink-soft focus:border-brand-400/40 focus:bg-brand-500/[0.06]"
            />
          </div>
        </div>

        <p className="mt-2.5 mb-2.5 text-[11px] font-semibold text-ink-soft">
          Mostrando <span className="font-bold text-ink tabular-nums">{formatNumber(visibles.length)}</span>{' '}
          de <span className="font-bold tabular-nums">{formatNumber(propios.length)}</span> registros de la sede
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

function SedeKpi({
  icon,
  label,
  value,
  hint,
  from,
  to,
  solid,
  delay,
  percent,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  hint: string;
  from: string;
  to: string;
  solid: string;
  delay: number;
  percent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group glass relative overflow-hidden rounded-2xl px-3.5 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
      style={{ boxShadow: `0 10px 30px -18px ${solid}99` }}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-25 transition-opacity duration-300 group-hover:opacity-40"
        style={{ background: `radial-gradient(120% 100% at 8% 0%, ${from}66, transparent 60%)` }}
      />
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${solid}, transparent)` }}
      />

      <div className="relative flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})`, boxShadow: `0 8px 20px -10px ${solid}cc` }}
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className="text-3xl leading-none font-extrabold tracking-tight tabular-nums"
            style={{ color: solid, textShadow: `0 2px 18px ${solid}59` }}
          >
            <CountUp value={value} format={percent ? 'percent' : 'number'} />
          </p>
          <p className="mt-1.5 text-[10px] font-bold tracking-[0.1em] text-ink uppercase">{label}</p>
          <p className="mt-0.5 truncate text-[10px] leading-tight text-ink-soft" title={hint}>
            {hint}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

const COLUMNS: Array<{ header: string; cell: (r: Promotor) => ReactNode; className?: string }> = [
  { header: 'DNI', cell: (r) => <span className="tabular-nums text-ink">{r.dni || '—'}</span> },
  {
    header: 'Nombre completo',
    cell: (r) => <span className="font-semibold text-ink">{r.apellidosNombres}</span>,
  },
  { header: 'Supervisor', cell: (r) => <span className="text-ink-muted">{r.supervisor || '—'}</span> },
  {
    header: 'Responsable A&S',
    cell: (r) => <span className="text-ink-muted">{r.responsableAS || '—'}</span>,
  },
  { header: 'Capacitador', cell: (r) => <span className="text-ink-muted">{r.capacitador || '—'}</span> },
  {
    header: 'Fecha de ingreso',
    cell: (r) => <span className="tabular-nums text-ink-muted">{r.fechasISO.fechaIngreso || '—'}</span>,
  },
  {
    header: 'Total de días',
    cell: (r) => (
      <span className="font-semibold tabular-nums" style={{ color: r.totalDias == null ? '#64748b' : undefined }}>
        {r.totalDias ?? '—'}
      </span>
    ),
  },
  { header: 'Estado', cell: (r) => <EstadoBadge r={r} /> },
];

function EstadoBadge({ r }: { r: Promotor }) {
  let tone: 'success' | 'danger' | 'warning' | 'neutral' = 'neutral';
  if (esAprobado(r)) tone = 'success';
  else if (esBajaCapacitacion(r)) tone = 'danger';
  else if (esEnCapacitacion(r)) tone = 'warning';
  return (
    <Badge tone={tone} dot dotColor={ESTADO_DOT[r.estado]}>
      {ESTADO_LABELS[r.estado] ?? r.estado}
    </Badge>
  );
}

function RecordTable({ rows, onSelect }: { rows: Promotor[]; onSelect: (p: Promotor) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface/40">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-surface-3/95 text-[10px] tracking-wide text-ink-soft uppercase backdrop-blur">
          <tr className="border-b border-line">
            <th className="px-3 py-2.5 font-bold">#</th>
            {COLUMNS.map((c) => (
              <th key={c.header} className="px-3 py-2.5 font-bold whitespace-nowrap">
                {c.header}
              </th>
            ))}
            <th className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {rows.map((r, i) => (
            <tr
              key={r.id}
              onClick={() => onSelect(r)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSelect(r);
              }}
              tabIndex={0}
              role="button"
              aria-label={`Ver detalle de ${r.apellidosNombres}`}
              className="cursor-pointer transition-colors hover:bg-surface-3/50 focus-visible:bg-surface-3/50 focus-visible:outline-none"
            >
              <td className="px-3 py-2 text-ink-soft tabular-nums">{formatNumber(i + 1)}</td>
              {COLUMNS.map((c) => (
                <td key={c.header} className={cn('px-3 py-2 whitespace-nowrap', c.className)}>
                  {c.cell(r)}
                </td>
              ))}
              <td className="px-3 py-2 text-right">
                <ChevronRight className="inline size-4 text-ink-soft" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
