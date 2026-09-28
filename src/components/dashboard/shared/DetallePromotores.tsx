'use client';

import { useCallback, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CountUp } from '@/components/ui/count-up';
import { esAprobado, esBajaCapacitacion } from '@/services/analytics/desercionBase';
import { formatNumber, normalizeKey } from '@/lib/utils';
import { ESTADO_DOT, ESTADO_LABELS } from '@/lib/constants';
import type { Promotor } from '@/types';

/** Minúsculas sin tildes, para búsquedas tolerantes. */
export function fold(value: string): string {
  return normalizeKey(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('') || '—'
  );
}

export function slug(value: string): string {
  return (
    fold(value)
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'RECLUTADOR'
  );
}

function stamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

export const AVATAR_GRADIENTS: Array<[string, string]> = [
  ['#be123c', '#f43f5e'],
  ['#c2410c', '#fb923c'],
  ['#7c3aed', '#a855f7'],
  ['#0f766e', '#2dd4bf'],
  ['#1d4ed8', '#60a5fa'],
  ['#a16207', '#facc15'],
];

export function avatarGradient(name: string): [string, string] {
  return AVATAR_GRADIENTS[(name.length + name.charCodeAt(0)) % AVATAR_GRADIENTS.length];
}

/** Exporta el conjunto visible a Excel o CSV con carga diferida. */
export function useExportarRegistros(prefix: string) {
  return useCallback(
    async (rows: Promotor[], formato: 'xlsx' | 'csv', etiqueta: string) => {
      if (rows.length === 0) return;
      const fileName = `${prefix}_${slug(etiqueta)}_${stamp()}.${formato}`;
      try {
        const { exportExcel, exportCSV } = await import('@/services/export/exporter');
        if (formato === 'xlsx') exportExcel(rows, fileName);
        else exportCSV(rows, fileName);
        toast.success(`Reporte ${formato.toUpperCase()} generado (${formatNumber(rows.length)} registros)`);
      } catch (error) {
        console.error('[useExportarRegistros] no se pudo exportar:', error);
        toast.error('No se pudo generar el reporte. Inténtalo de nuevo.');
      }
    },
    [prefix],
  );
}

export function BotonExportar({
  total,
  onExport,
}: {
  total: number;
  onExport: (formato: 'xlsx' | 'csv') => void;
}) {
  return (
    <>
      <Button variant="brand" size="sm" disabled={total === 0} onClick={() => onExport('xlsx')}>
        <FileSpreadsheet className="size-4" />
        EXCEL ({formatNumber(total)})
      </Button>
      <Button variant="outline" size="sm" disabled={total === 0} onClick={() => onExport('csv')}>
        <FileDown className="size-4" />
        CSV
      </Button>
    </>
  );
}

export function ModalKpi({
  icon,
  label,
  value,
  hint,
  from,
  to,
  solid,
  delay = 0,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  hint: string;
  from: string;
  to: string;
  solid: string;
  delay?: number;
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
            <CountUp value={value} />
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

export function EstadoBadge({ r }: { r: Promotor }) {
  let tone: 'success' | 'danger' | 'warning' | 'neutral' = 'neutral';
  if (esAprobado(r)) tone = 'success';
  else if (esBajaCapacitacion(r)) tone = 'danger';
  return (
    <Badge tone={tone} dot dotColor={ESTADO_DOT[r.estado]}>
      {ESTADO_LABELS[r.estado] ?? r.estado}
    </Badge>
  );
}

const COLUMNS: Array<{ header: string; cell: (r: Promotor) => ReactNode }> = [
  { header: 'DNI', cell: (r) => <span className="tabular-nums text-ink">{r.dni || '—'}</span> },
  { header: 'Nombre completo', cell: (r) => <span className="font-semibold text-ink">{r.apellidosNombres}</span> },
  { header: 'Tienda', cell: (r) => <span className="text-ink-muted">{r.nombreTienda || '—'}</span> },
  {
    header: 'Fecha de ingreso',
    cell: (r) => <span className="tabular-nums text-ink-muted">{r.fechasISO.fechaIngreso || '—'}</span>,
  },
  {
    header: 'Total de días',
    cell: (r) => (
      <span
        className="font-semibold tabular-nums"
        style={{ color: r.totalDias == null ? '#64748b' : undefined }}
      >
        {r.totalDias ?? '—'}
      </span>
    ),
  },
  { header: 'Estado', cell: (r) => <EstadoBadge r={r} /> },
];

export function RecordTable({ rows, onSelect }: { rows: Promotor[]; onSelect?: (p: Promotor) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface/40">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-surface-3/95 text-[10px] tracking-wide text-ink-soft uppercase backdrop-blur">
          <tr className="border-b border-line">
            <th className="px-3 py-2.5 font-bold">#</th>
            {COLUMNS.map((c) => (
              <th key={c.header} className="px-3 py-2.5 font-bold whitespace-nowrap">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line/60">
          {rows.map((r, i) => (
            <tr
              key={r.id}
              onClick={onSelect ? () => onSelect(r) : undefined}
              onKeyDown={
                onSelect
                  ? (e) => {
                      if (e.key === 'Enter') onSelect(r);
                    }
                  : undefined
              }
              tabIndex={onSelect ? 0 : undefined}
              role={onSelect ? 'button' : undefined}
              aria-label={onSelect ? `Ver detalle de ${r.apellidosNombres}` : undefined}
              className={
                onSelect
                  ? 'cursor-pointer transition-colors hover:bg-surface-3/50 focus-visible:bg-surface-3/50 focus-visible:outline-none'
                  : undefined
              }
            >
              <td className="px-3 py-2 text-ink-soft tabular-nums">{formatNumber(i + 1)}</td>
              {COLUMNS.map((c) => (
                <td key={c.header} className="px-3 py-2 whitespace-nowrap">
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
