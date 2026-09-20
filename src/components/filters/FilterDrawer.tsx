'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  ChevronDown,
  GraduationCap,
  MapPin,
  SlidersHorizontal,
  TrendingDown,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { useAppData } from '@/hooks/useAppData';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { CapacitadorMultiSelect } from '@/components/filters/CapacitadorMultiSelect';
import { PeriodoAnalisis } from '@/components/filters/PeriodoAnalisis';
import {
  DateFilterInput,
  DATE_LABELS,
  useCapacitadorOptions,
  useUniqueValues,
} from '@/components/filters/fields';
import { activeFiltersOf } from '@/lib/filterDescriptions';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { FilterState } from '@/types';

function FilterGroup({
  title,
  icon: Icon,
  active,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  icon: LucideIcon;
  active: number;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-surface/40"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-line bg-brand-50 text-brand-600">
          <Icon className="size-3.5" />
        </span>
        <span className="text-xs font-bold tracking-wider text-ink uppercase">{title}</span>
        {active > 0 && (
          <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold text-brand-600 tabular-nums">
            {active}
          </span>
        )}
        <ChevronDown
          className={cn('ml-auto size-4 shrink-0 text-ink-soft transition-transform duration-300', collapsed && '-rotate-90')}
        />
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-line p-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterDrawer() {
  const open = useDataStore((s) => s.filterDrawerOpen);
  const close = useDataStore((s) => s.closeFilterDrawer);
  const filters = useDataStore((s) => s.filters);
  const setFilters = useDataStore((s) => s.setFilters);
  const resetFilters = useDataStore((s) => s.resetFilters);
  const active = useDataStore((s) => s.activeFiltersCount);
  const isProcessing = useDataStore((s) => s.isProcessing);
  const { filtered, records } = useAppData();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const jurisdicciones = useUniqueValues('jurisdiccion');
  const zonas = useUniqueValues('zonaComercial', { normalize: true });
  const sedes = useUniqueValues('sede');
  const distritos = useUniqueValues('distrito');
  const tiendas = useUniqueValues('nombreTienda');
  const supervisores = useUniqueValues('supervisor');
  const responsables = useUniqueValues('responsableAS');
  const modalidades = useUniqueValues('modalidad');
  const capacitadores = useCapacitadorOptions();
  const motivos = useUniqueValues('motivoCaida');
  const subMotivos = useUniqueValues('subMotivoCaida');

  const toggleGroup = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));
  const isCollapsed = (id: string) => collapsed[id] === true;

  const update = (patch: Partial<FilterState>) => setFilters({ ...filters, ...patch });

  const ubicacionActive = activeFiltersOf(filters, ['jurisdiccion', 'zonaComercial', 'sede', 'distrito', 'tienda']);
  const gestionActive = activeFiltersOf(filters, ['supervisor', 'responsableAS']);
  const capacitacionActive = activeFiltersOf(filters, ['modalidad', 'capacitador', 'inicioCapacitacion', 'finCapacitacion', 'entregaOperaciones']);
  const resultadosActive = activeFiltersOf(filters, ['pasaAOperaciones', 'motivoCaida', 'subMotivoCaida']);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="pointer-events-none fixed inset-0 z-[80]">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="bg-surface-2 pointer-events-auto absolute inset-y-0 right-0 z-10 flex w-full max-w-md flex-col border-l border-line shadow-[0_0_60px_-20px_rgba(17,24,39,0.25)]"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 z-0 h-full w-px bg-gradient-to-b from-transparent via-brand-500/40 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

            <div className="relative z-10 flex items-center gap-3 border-b border-line/80 px-5 py-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl gradient-brand text-white">
                <SlidersHorizontal className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold tracking-wide text-ink uppercase">Filtros</p>
                <p className="truncate text-[11px] font-medium text-ink-soft">Globales · panel lateral</p>
              </div>
              {active > 0 && (
                <span className="shrink-0 rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-bold text-brand-600 tabular-nums">
                  {active}
                </span>
              )}
              <button
                onClick={close}
                aria-label="Cerrar filtros"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-line text-ink-muted transition-all duration-300 hover:border-brand-500/30 hover:bg-brand-50 hover:text-brand-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              <PeriodoAnalisis />

              <div className="flex items-center gap-2 rounded-xl border border-brand-500/20 bg-brand-500/8 px-3 py-2 text-[11px] font-semibold text-brand-600">
                <span className="size-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_currentColor]" />
                Cambios en tiempo real · el dashboard sigue visible
              </div>

              <FilterGroup
                title="Ubicación"
                icon={MapPin}
                active={ubicacionActive}
                collapsed={isCollapsed('ubicacion')}
                onToggle={() => toggleGroup('ubicacion')}
              >
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted">Jurisdicción</label>
                  <Select value={filters.jurisdiccion} onChange={(e) => update({ jurisdiccion: e.target.value })}>
                    <option value="">Todas</option>
                    {jurisdicciones.map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted">Zona comercial</label>
                  <Select value={filters.zonaComercial} onChange={(e) => update({ zonaComercial: e.target.value })}>
                    <option value="">Todas</option>
                    {zonas.map((z) => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted">Sede</label>
                  <Select value={filters.sede} onChange={(e) => update({ sede: e.target.value })}>
                    <option value="">Todas</option>
                    {sedes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted">Distrito</label>
                  <Select value={filters.distrito} onChange={(e) => update({ distrito: e.target.value })}>
                    <option value="">Todos</option>
                    {distritos.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted">Tienda</label>
                  <Select value={filters.tienda} onChange={(e) => update({ tienda: e.target.value })}>
                    <option value="">Todas</option>
                    {tiendas.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </div>
              </FilterGroup>

              <FilterGroup
                title="Gestión"
                icon={Building2}
                active={gestionActive}
                collapsed={isCollapsed('gestion')}
                onToggle={() => toggleGroup('gestion')}
              >
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted">Supervisor</label>
                  <Select value={filters.supervisor} onChange={(e) => update({ supervisor: e.target.value })}>
                    <option value="">Todos</option>
                    {supervisores.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted">Responsable A&S</label>
                  <Select value={filters.responsableAS} onChange={(e) => update({ responsableAS: e.target.value })}>
                    <option value="">Todos</option>
                    {responsables.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Select>
                </div>
              </FilterGroup>

              <FilterGroup
                title="Capacitación"
                icon={GraduationCap}
                active={capacitacionActive}
                collapsed={isCollapsed('capacitacion')}
                onToggle={() => toggleGroup('capacitacion')}
              >
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted">Modalidad</label>
                  <Select value={filters.modalidad} onChange={(e) => update({ modalidad: e.target.value })}>
                    <option value="">Todas</option>
                    {modalidades.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted">Capacitador</label>
                  <CapacitadorMultiSelect
                    value={filters.capacitador}
                    onChange={(v) => update({ capacitador: v })}
                    options={capacitadores}
                  />
                </div>
                <div className="sm:col-span-2">
                  <DateFilterInput
                    label={DATE_LABELS.inicioCapacitacion}
                    value={filters.inicioCapacitacion}
                    onChange={(v) => update({ inicioCapacitacion: v })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <DateFilterInput
                    label={DATE_LABELS.finCapacitacion}
                    value={filters.finCapacitacion}
                    onChange={(v) => update({ finCapacitacion: v })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <DateFilterInput
                    label={DATE_LABELS.entregaOperaciones}
                    value={filters.entregaOperaciones}
                    onChange={(v) => update({ entregaOperaciones: v })}
                  />
                </div>
              </FilterGroup>

              <FilterGroup
                title="Resultados"
                icon={TrendingDown}
                active={resultadosActive}
                collapsed={isCollapsed('resultados')}
                onToggle={() => toggleGroup('resultados')}
              >
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted">Pasa a operaciones</label>
                  <Select value={filters.pasaAOperaciones} onChange={(e) => update({ pasaAOperaciones: e.target.value })}>
                    <option value="">Todos</option>
                    <option value="1">Sí (aprobado)</option>
                    <option value="0">No (no aprobado)</option>
                    <option value="Pendiente">Pendiente</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted">Motivo de caída</label>
                  <Select value={filters.motivoCaida} onChange={(e) => update({ motivoCaida: e.target.value })}>
                    <option value="">Todos</option>
                    {motivos.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold tracking-wide text-ink-muted">Submotivo de caída</label>
                  <Select value={filters.subMotivoCaida} onChange={(e) => update({ subMotivoCaida: e.target.value })}>
                    <option value="">Todos</option>
                    {subMotivos.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Select>
                </div>
              </FilterGroup>
            </div>

            <div className="relative z-10 border-t border-line/80 px-4 py-3">
              <div className="mb-2.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-ink-soft">
                <span>
                  <span className="font-bold text-brand-600 tabular-nums">{formatNumber(filtered.length)}</span> de{' '}
                  <span className="font-bold text-ink tabular-nums">{formatNumber(records.length)}</span> registros
                </span>
                <span className="tabular-nums">
                  {active} filtro{active === 1 ? '' : 's'} activo{active === 1 ? '' : 's'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="brand" className="flex-1" onClick={close} disabled={isProcessing}>
                  VER RESULTADOS
                </Button>
                <Button variant="outline" onClick={resetFilters} disabled={active === 0}>
                  LIMPIAR
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}