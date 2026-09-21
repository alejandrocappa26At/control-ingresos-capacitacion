'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Eye,
} from 'lucide-react';
import type { Promotor } from '@/types';
import { cn } from '@/lib/utils';
import { etapaSalida, type EtapaSalidaKind } from '@/lib/etapa';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ESTADO_LABELS, ESTADO_DOT } from '@/lib/constants';

const columnHelper = createColumnHelper<Promotor>();

function EstadoBadge({ estado }: { estado: Promotor['estado'] }) {
  const label = ESTADO_LABELS[estado] ?? 'PENDIENTE';
  const dotColor = ESTADO_DOT[estado] ?? 'bg-slate-400';
  const tone =
    estado === 'APROBADO' ? 'success' : estado === 'NO_APROBADO' ? 'danger' : estado === 'EN_CAPACITACION' ? 'warning' : 'neutral';
  return (
    <Badge tone={tone} dot dotColor={dotColor}>
      {label}
    </Badge>
  );
}

export function buildColumns(): ColumnDef<Promotor, unknown>[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cols: Array<ColumnDef<Promotor, any>> = [
    columnHelper.accessor('jurisdiccion', {
      header: 'Jurisdicción',
      cell: (info) => <Badge tone={info.getValue() === 'LIMA' ? 'brand' : 'info'}>{info.getValue()}</Badge>,
    }),
    columnHelper.accessor('fechaIngreso', { header: 'Fecha ingreso' }),
    columnHelper.accessor('zonaComercial', { header: 'Zona comercial' }),
    columnHelper.accessor('sede', { header: 'Sede' }),
    columnHelper.accessor('distrito', { header: 'Distrito' }),
    columnHelper.accessor('nombreTienda', { header: 'Tienda' }),
    columnHelper.accessor('supervisor', { header: 'Supervisor' }),
    columnHelper.accessor('responsableAS', { header: 'Responsable A&S' }),
    columnHelper.accessor('dni', {
      header: 'DNI',
      cell: (info) => <span className="font-mono text-xs font-semibold text-ink-muted">{info.getValue()}</span>,
    }),
    columnHelper.accessor('apellidosNombres', {
      header: 'Nombre completo',
      cell: (info) => <span className="font-semibold text-ink">{info.getValue()}</span>,
    }),
    columnHelper.accessor('modalidad', { header: 'Modalidad' }),
    columnHelper.accessor('capacitador', { header: 'Capacitador' }),
    columnHelper.accessor('inicioCapacitacion', { header: 'Inicio capacitación' }),
    columnHelper.accessor('finCapacitacion', { header: 'Fin capacitación' }),
    columnHelper.accessor('entregaOperaciones', { header: 'Entrega operaciones' }),
    columnHelper.accessor('diasAsistidos', {
      header: 'Días asistidos',
      cell: (info) => (
        <span className={cn('tabular-nums font-semibold', info.getValue() === 10 ? 'text-emerald-400' : info.getValue() <= 3 ? 'text-rose-400' : 'text-ink')}>
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('diasFaltantes', {
      header: 'Días faltantes',
      cell: (info) => <span className="tabular-nums text-ink-muted">{info.getValue()}</span>,
    }),
    columnHelper.accessor('resultado', {
      header: 'Resultado',
      cell: (info) => {
        const value = info.getValue();
        if (value === 'APROBADO') return <Badge tone="success" dot dotColor="bg-emerald-500">Pasa</Badge>;
        if (value === 'NO_APROBADO') return <Badge tone="danger" dot dotColor="bg-rose-500">No pasa</Badge>;
        return <Badge tone="neutral" dot dotColor="bg-slate-400">Pendiente</Badge>;
      },
    }),
    columnHelper.accessor('totalDias', {
      header: 'Etapa de salida',
      cell: (info) => {
        const promotor = info.row.original;
        const etapa = etapaSalida(promotor);
        const tone: Record<EtapaSalidaKind, { text: string; dot: string }> = {
          NUNCA_ASISTIO: { text: 'text-rose-400', dot: 'bg-rose-500' },
          DIA: { text: 'text-rose-500', dot: 'bg-rose-400' },
          PASO_A_OPERACIONES: { text: 'text-emerald-400', dot: 'bg-emerald-500' },
          EN_CAPACITACION: { text: 'text-amber-400', dot: 'bg-amber-400' },
        };
        return (
          <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold', tone[etapa.kind].text)}>
            <span className={cn('size-1.5 shrink-0 rounded-full', tone[etapa.kind].dot)} />
            {etapa.label}
          </span>
        );
      },
    }),
    columnHelper.accessor('motivoCaida', { header: 'Motivo caída' }),
    columnHelper.accessor('subMotivoCaida', { header: 'Submotivo caída' }),
    columnHelper.accessor('estado', {
      header: 'Estado',
      cell: (info) => <EstadoBadge estado={info.getValue()} />,
    }),
  ];
  return cols as ColumnDef<Promotor, unknown>[];
}

interface DataTableProps {
  data: Promotor[];
  onRowClick?: (promotor: Promotor) => void;
  pageSize?: number;
  loading?: boolean;
}

export function DataTable({ data, onRowClick, pageSize = 10, loading }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>({});
  const [showColumns, setShowColumns] = React.useState(false);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize });

  const columns = React.useMemo(() => buildColumns(), []);
  const columnRef = React.useRef<HTMLDivElement>(null);

  const tableTimerStarted = React.useRef(false);
  const tableTimedCount = React.useRef(0);

  if (!tableTimerStarted.current && data.length > 0) {
    tableTimerStarted.current = true;
    tableTimedCount.current = data.length;
    console.time('Tabla');
  }

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    defaultColumn: { minSize: 120 },
  });

  const allSelectable = columns.filter((c) => 'accessorKey' in c);
  const allVisible = allSelectable.every((c) => {
    const key = (c as { accessorKey?: string }).accessorKey ?? '';
    return columnVisibility[key] !== false;
  });

  React.useEffect(() => {
    if (data.length < pagination.pageSize && pagination.pageIndex > 0) {
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }
  }, [data.length, pagination.pageSize, pagination.pageIndex]);

  React.useEffect(() => {
    if (tableTimerStarted.current && data.length === tableTimedCount.current) {
      tableTimerStarted.current = false;
      console.timeEnd('Tabla');
    }
  });

  if (loading) {
    return (
      <div className="h-96 animate-pulse rounded-2xl border border-line bg-surface-2 p-6">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-surface-3" style={{ opacity: 1 - i * 0.1 }} />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="No hay registros para mostrar"
        description="Ajusta los filtros o el buscador global, o carga un nuevo archivo Excel de capacitación."
        className="mt-4"
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-ink">
          {table.getFilteredRowModel().rows.length.toLocaleString('es-PE')} registros
        </p>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowColumns((s) => !s)}
            className="inline-flex items-center gap-2"
          >
            <Columns3 className="size-3.5" />
            Columnas
          </Button>
          {showColumns && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColumns(false)} />
              <div
                ref={columnRef}
                className="absolute right-0 z-20 mt-2 max-h-80 w-64 overflow-y-auto rounded-xl border border-line bg-surface-2 p-3 shadow-card"
              >
                <div className="mb-2 flex items-center justify-between border-b border-line pb-2">
                  <span className="text-xs font-bold text-ink">Seleccionar columnas</span>
                  <button
                    onClick={() => {
                      const next: Record<string, boolean> = {};
                      allSelectable.forEach((c) => {
                        const key = (c as { accessorKey?: string }).accessorKey ?? '';
                        next[key] = !allVisible;
                      });
                      setColumnVisibility(next);
                    }}
                    className="text-[11px] font-semibold text-brand-400"
                  >
                    {allVisible ? 'Quitar todas' : 'Mostrar todas'}
                  </button>
                </div>
                <div className="space-y-1">
                  {allSelectable.map((c) => {
                    const key = (c as { accessorKey?: string }).accessorKey ?? '';
                    const label = typeof c.header === 'string' ? c.header : key;
                    const checked = columnVisibility[key] !== false;
                    return (
                      <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-surface-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setColumnVisibility((prev) => ({ ...prev, [key]: !checked }))}
                          className="size-3.5 accent-brand-500"
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-h-[68vh] overflow-auto">
        <table className="w-full min-w-max border-collapse text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-line">
                {headerGroup.headers.map((header) => {
                  const sort = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="sticky top-0 z-10 border-b border-line bg-surface-2 px-3 py-2.5 text-[11px] font-bold tracking-wide whitespace-nowrap text-ink-muted uppercase first:rounded-tl-xl"
                      style={{ width: header.getSize() }}
                    >
                      {header.column.getCanSort() ? (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1.5 transition-colors hover:text-ink"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sort === 'asc' ? (
                            <ArrowUp className="size-3 text-brand-400" />
                          ) : sort === 'desc' ? (
                            <ArrowDown className="size-3 text-brand-400" />
                          ) : (
                            <ArrowUpDown className="size-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={cn(
                  'group border-b border-line transition-all duration-200 last:border-0',
                  rowIndex % 2 === 1 && 'bg-surface/40',
                  onRowClick && 'cursor-pointer hover:bg-brand-500/10 hover:shadow-[inset_3px_0_0_rgba(227,6,19,0.55)]',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 whitespace-nowrap text-ink-muted">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    {cell.id.includes('apellidosNombres') && (
                      <span className="ml-1.5 align-middle text-xs text-brand-400 opacity-0 transition-opacity group-hover:opacity-100">
                        <Eye className="inline size-3" />
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
        <p className="text-xs text-ink-soft">
          Página {table.getState().pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())} ·{' '}
          {table.getFilteredRowModel().rows.length.toLocaleString('es-PE')} resultados
        </p>
        <div className="flex items-center gap-2">
          <select
            value={pagination.pageSize}
            onChange={(e) => setPagination({ pageIndex: 0, pageSize: Number(e.target.value) })}
            className="h-8 rounded-lg border border-line bg-surface/60 px-2 text-xs font-medium text-ink backdrop-blur transition-all focus:border-brand-400/70 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n} por página</option>
            ))}
          </select>
          <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export { EstadoBadge };