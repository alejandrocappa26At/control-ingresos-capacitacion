'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  UserX,
  GraduationCap,
  FileSpreadsheet,
  FileDown,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal, ModalClose } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { esDesercion, esBajaCapacitacion } from '@/services/analytics/desercionBase';
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
  todos: 'Sin registros para este capacitador.',
  aprobados: 'Sin aprobados registrados.',
  bajas: 'Sin bajas durante capacitación.',
  desercion: 'Sin deserciones registradas.',
  enCapacitacion: 'Sin registros activos en capacitación.',
};

const AVATAR_GRADIENTS: Array<[string, string]> = [
  ['#e30613', '#ff3b47'],
  ['#8b5cf6', '#c4b5fd'],
  ['#10b981', '#34d399'],
  ['#f59e0b', '#fbbf24'],
  ['#6366f1', '#a5b4fc'],
  ['#0ea5e9', '#7dd3fc'],
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
}

function fold(value: string): string {
  return normalizeKey(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function esEnCapacitacion(r: Promotor): boolean {
  return r.pasaAOperaciones !== 1 && r.pasaAOperaciones !== 0;
}

function slug(value: string): string {
  return (
    fold(value)
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'CAPACITADOR'
  );
}

function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function MatchesTab({ tab, r }: { tab: TabId; r: Promotor }): boolean {
  if (tab === 'todos') return true;
  if (tab === 'aprobados') return r.pasaAOperaciones === 1;
  if (tab === 'bajas') return esBajaCapacitacion(r);
  if (tab === 'desercion') return esDesercion(r);
  return esEnCapacitacion(r);
}

interface CapacitadorDetailModalProps {
  capacitador: string | null;
  records: Promotor[];
  periodo: string;
  onClose: () => void;
}

export function CapacitadorDetailModal({ capacitador, records, periodo, onClose }: CapacitadorDetailModalProps) {
  const [tab, setTab] = useState<TabId>('todos');
  const [query, setQuery] = useState('');

  const propios = useMemo(() => {
    if (!capacitador) return [];
    return records.filter((r) => normalizeKey(r.capacitador) === capacitador);
  }, [records, capacitador]);

  const conteos = useMemo(() => {
    const base: Record<TabId, number> = { todos: propios.length, aprobados: 0, bajas: 0, desercion: 0, enCapacitacion: 0 };
    for (const r of propios) {
      for (const t of TABS) {
        if (t.id !== 'todos' && MatchesTab({ tab: t.id, r })) base[t.id] += 1;
      }
    }
    return base;
  }, [propios]);

  const visibles = useMemo(() => {
    const q = fold(query);
    return propios.filter((r) => {
      if (!MatchesTab({ tab, r })) return false;
      if (!q) return true;
      return fold(r.apellidosNombres).includes(q) || fold(r.dni).includes(q) || fold(r.nombreTienda).includes(q);
    });
  }, [propios, tab, query]);

  const resumen = useMemo(
    () => ({
      ingresos: propios.length,
      aprobados: conteos.aprobados,
      bajas: conteos.bajas,
      desercion: conteos.desercion,
      enCapacitacion: conteos.enCapacitacion,
    }),
    [propios.length, conteos],
  );

  const exportar = useCallback(
    async (formato: 'xlsx' | 'csv') => {
      if (visibles.length === 0) return;
      const fileName = `capacitador_${slug(capacitador ?? '')}_${stamp()}.${formato}`;
      try {
        const { exportExcel, exportCSV } = await import('@/services/export/exporter');
        if (formato === 'xlsx') exportExcel(visibles, fileName);
        else exportCSV(visibles, fileName);
        toast.success(`Reporte ${formato.toUpperCase()} generado (${formatNumber(visibles.length)} registros)`);
      } catch (error) {
        console.error('[CapacitadorDetailModal] no se pudo exportar:', error);
        toast.error('No se pudo generar el reporte. Inténtalo de nuevo.');
      }
    },
    [visibles, capacitador],
  );

  if (!capacitador) return null;

  const [from, to] = AVATAR_GRADIENTS[(capacitador.length + capacitador.charCodeAt(0)) % AVATAR_GRADIENTS.length];

  return (
    <Modal open onClose={onClose} fullscreen>
      <div className="relative shrink-0 overflow-hidden border-b border-line">
        <div className="bg-mesh absolute inset-0" />
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
        <div className="relative flex flex-wrap items-start gap-4 px-5 py-4 sm:px-7 sm:py-5">
          <motion.span
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-glow"
            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
          >
            {initialsOf(capacitador)}
          </motion.span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.14em] text-ink-muted uppercase">Detalle del capacitador</p>
            <p className="mt-0.5 truncate text-lg font-bold tracking-tight text-ink" title={capacitador}>
              {capacitador}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="brand" dot dotColor="bg-brand-500">
                <CalendarDays className="size-3" />
                {periodo}
              </Badge>
              <Badge tone="info">{formatNumber(resumen.ingresos)} registros</Badge>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="brand"
              size="sm"
              disabled={visibles.length === 0}
              onClick={() => void exportar('xlsx')}
            >
              <FileSpreadsheet className="size-4" />
              EXCEL ({formatNumber(visibles.length)})
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={visibles.length === 0}
              onClick={() => void exportar('csv')}
            >
              <FileDown className="size-4" />
              CSV
            </Button>
            <ModalClose onClose={onClose} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-3 sm:px-7 lg:grid-cols-5">
        <QuickMetric icon={<Users className="size-4" />} label="Total ingresos" value={resumen.ingresos} color="#3b82f6" />
        <QuickMetric icon={<CheckCircle2 className="size-4" />} label="Aprobados" value={resumen.aprobados} color="#10b981" />
        <QuickMetric icon={<AlertCircle className="size-4" />} label="Baja en capacitación" value={resumen.bajas} color="#f97316" />
        <QuickMetric icon={<UserX className="size-4" />} label="Deserción" value={resumen.desercion} color="#71717a" />
        <QuickMetric
          icon={<GraduationCap className="size-4" />}
          label="En capacitación"
          value={resumen.enCapacitacion}
          color="#eab308"
        />
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
                      layoutId="cap-tab"
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

          <div className="relative w-full sm:w-64">
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
          <span className="font-bold tabular-nums">{formatNumber(propios.length)}</span> registros
        </p>

        {visibles.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-soft">
            {query ? 'Sin resultados para la búsqueda.' : EMPTY_COPY[tab]}
          </p>
        ) : (
          <RecordTable tab={tab} rows={visibles} />
        )}
      </div>
    </Modal>
  );
}

function QuickMetric({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface/50 px-3 py-2.5 transition-all duration-300 hover:bg-surface-3/50">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border"
        style={{ borderColor: `${color}47`, background: `${color}1f`, color }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg leading-none font-bold tabular-nums text-ink">{formatNumber(value)}</p>
        <p className="mt-1 truncate text-[9px] font-bold tracking-[0.08em] text-ink-soft uppercase" title={label}>
          {label}
        </p>
      </div>
    </div>
  );
}

type Column = { header: string; cell: (r: Promotor) => ReactNode; className?: string };

const COLUMNS: Record<TabId, Column[]> = {
  todos: [
    { header: 'Nombre completo', cell: (r) => <span className="font-semibold text-ink">{r.apellidosNombres}</span> },
    { header: 'DNI', cell: (r) => r.dni, className: 'tabular-nums text-ink' },
    { header: 'Tienda', cell: (r) => <span className="text-ink-muted">{r.nombreTienda}</span> },
    { header: 'Supervisor', cell: (r) => <span className="text-ink-muted">{r.supervisor}</span> },
    { header: 'Responsable A&S', cell: (r) => <span className="text-ink-muted">{r.responsableAS}</span> },
    { header: 'Fecha ingreso', cell: (r) => <span className="tabular-nums text-ink-muted">{r.fechaIngreso}</span> },
    { header: 'Estado', cell: (r) => <EstadoBadge r={r} /> },
  ],
  aprobados: [
    { header: 'Nombre completo', cell: (r) => <span className="font-semibold text-ink">{r.apellidosNombres}</span> },
    { header: 'DNI', cell: (r) => r.dni, className: 'tabular-nums text-ink' },
    { header: 'Tienda', cell: (r) => <span className="text-ink-muted">{r.nombreTienda}</span> },
    { header: 'Fecha ingreso', cell: (r) => <span className="tabular-nums text-ink-muted">{r.fechaIngreso}</span> },
    { header: 'Estado', cell: (r) => <EstadoBadge r={r} /> },
  ],
  bajas: [
    { header: 'Nombre completo', cell: (r) => <span className="font-semibold text-ink">{r.apellidosNombres}</span> },
    { header: 'DNI', cell: (r) => r.dni, className: 'tabular-nums text-ink' },
    { header: 'Tienda', cell: (r) => <span className="text-ink-muted">{r.nombreTienda}</span> },
    { header: 'Fecha ingreso', cell: (r) => <span className="tabular-nums text-ink-muted">{r.fechaIngreso}</span> },
    {
      header: 'Día de caída',
      cell: (r) => <span className="font-semibold tabular-nums text-amber-400">Día {r.totalDias ?? '—'}</span>,
    },
    { header: 'Motivo de caída', cell: (r) => <span className="text-ink-muted">{r.motivoCaida || '—'}</span> },
  ],
  desercion: [
    { header: 'Nombre completo', cell: (r) => <span className="font-semibold text-ink">{r.apellidosNombres}</span> },
    { header: 'DNI', cell: (r) => r.dni, className: 'tabular-nums text-ink' },
    { header: 'Tienda', cell: (r) => <span className="text-ink-muted">{r.nombreTienda}</span> },
    { header: 'Fecha ingreso', cell: (r) => <span className="tabular-nums text-ink-muted">{r.fechaIngreso}</span> },
    { header: 'Estado', cell: (r) => <EstadoBadge r={r} /> },
  ],
  enCapacitacion: [
    { header: 'Nombre completo', cell: (r) => <span className="font-semibold text-ink">{r.apellidosNombres}</span> },
    { header: 'DNI', cell: (r) => r.dni, className: 'tabular-nums text-ink' },
    { header: 'Tienda', cell: (r) => <span className="text-ink-muted">{r.nombreTienda}</span> },
    {
      header: 'Inicio capacitación',
      cell: (r) => <span className="tabular-nums text-ink-muted">{r.inicioCapacitacion}</span>,
    },
    {
      header: 'Días asistidos',
      cell: (r) => (
        <span className="tabular-nums text-ink">
          {r.diasAsistidos} / 10
        </span>
      ),
    },
    { header: 'Estado', cell: (r) => <EstadoBadge r={r} /> },
  ],
};

function EstadoBadge({ r }: { r: Promotor }) {
  return (
    <Badge tone="neutral" dot dotColor={ESTADO_DOT[r.estado]}>
      {ESTADO_LABELS[r.estado] ?? r.estado}
    </Badge>
  );
}

function RecordTable({ tab, rows }: { tab: TabId; rows: Promotor[] }) {
  const columns = COLUMNS[tab];
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface/40">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-surface-3/95 text-[10px] tracking-wide text-ink-soft uppercase backdrop-blur">
          <tr className="border-b border-line">
            <th className="px-3 py-2.5 font-bold">#</th>
            {columns.map((c) => (
              <th key={c.header} className="px-3 py-2.5 font-bold whitespace-nowrap">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {rows.map((r, i) => (
            <tr key={r.id} className="transition-colors hover:bg-surface-3/50">
              <td className="px-3 py-2 text-ink-soft tabular-nums">{formatNumber(i + 1)}</td>
              {columns.map((c) => (
                <td key={c.header} className={cn('px-3 py-2 whitespace-nowrap', c.className)}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
