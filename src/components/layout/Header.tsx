'use client';

import { useEffect, useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  MoonStar,
  Sun,
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  FileDown,
  ChevronRight,
  Home,
  Clock3,
  X,
} from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { useAppData } from '@/hooks/useAppData';
import { useDebounce } from '@/hooks/useDebounce';
import { usePathname } from 'next/navigation';
import { exportExcel, exportCSV } from '@/services/export/exporter';
import { Tooltip } from '@/components/ui/tooltip';
import { FilterDrawer } from '@/components/filters/FilterDrawer';
import { toast } from 'sonner';
import { formatISOToDisplay } from '@/lib/dates';
import { cn } from '@/lib/utils';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/ingresos': 'Ingresos',
  '/capacitacion': 'Capacitación',
  '/asistencia': 'Asistencia',
  '/caidas': 'Análisis de Caídas',
  '/reportes': 'Reportes',
  '/upload': 'Cargar Excel',
};

export function Header() {
  const pathname = usePathname();
  const collapsed = useDataStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useDataStore((s) => s.toggleSidebar);
  const theme = useDataStore((s) => s.theme);
  const toggleTheme = useDataStore((s) => s.toggleTheme);
  const setSearchTerm = useDataStore((s) => s.setSearchTerm);
  const records = useDataStore((s) => s.records);
  const uploadMeta = useDataStore((s) => s.uploadMeta);
  const { filtered } = useAppData();

  const [value, setValue] = useState('');
  const debounced = useDebounce(value, 250);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFiltersCount = useDataStore((s) => s.activeFiltersCount);

  useEffect(() => {
    setSearchTerm(debounced);
  }, [debounced, setSearchTerm]);

  const title = TITLES[pathname] ?? 'Control de Ingresos y Capacitación';
  const hasData = records.length > 0;
  const isHome = pathname === '/';

  return (
    <header className="glass-strong sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line px-4 sm:px-6">
      <button
        onClick={toggleSidebar}
        className="inline-flex size-10 items-center justify-center rounded-xl text-ink-soft transition-all duration-300 hover:bg-surface-3 hover:text-ink hover:shadow-glow-sm"
        aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
      </button>

      <nav className="hidden min-w-0 items-center gap-1.5 sm:flex" aria-label="Breadcrumb">
        {!isHome && (
          <>
            <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <Home className="size-3.5" />
              Dashboard
            </span>
            <ChevronRight className="size-3.5 text-ink-soft/50" />
          </>
        )}
        <h1 className="truncate text-sm font-bold tracking-tight text-ink">{title}</h1>
        <span className="ml-1.5 hidden rounded-md border border-line bg-surface-3 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink-soft uppercase lg:inline-block">
          Plataforma de análisis
        </span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative w-52 md:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setValue('');
            }}
            placeholder="Buscar promotor..."
            className="h-10 w-full rounded-xl border border-line bg-surface/70 pr-10 pl-9 text-sm text-ink placeholder:text-ink-soft backdrop-blur transition-all duration-300 focus:border-brand-400/70 focus:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          />
          {value && (
            <button
              onClick={() => setValue('')}
              className="absolute top-1/2 right-2.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface-3 hover:text-ink"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Tooltip content="Filtros globales" side="bottom">
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            aria-label="Abrir filtros"
            className={cn(
              'relative inline-flex h-10 items-center gap-2 rounded-xl border px-2.5 transition-all duration-300 sm:px-3',
              activeFiltersCount > 0
                ? 'border-brand-400/40 bg-brand-500/10 text-brand-300 shadow-glow-sm hover:border-brand-400/60'
                : 'border-line bg-surface/40 text-ink-soft hover:border-brand-400/30 hover:bg-brand-500/10 hover:text-brand-300',
            )}
          >
            <SlidersHorizontal className={cn('size-4', activeFiltersCount > 0 && 'text-brand-400')} />
            <span className="hidden font-semibold text-xs lg:inline">FILTROS</span>
            {activeFiltersCount > 0 && (
              <span className="flex min-w-5 items-center justify-center rounded-full gradient-brand px-1.5 py-0.5 text-[10px] font-bold text-white shadow-glow-sm tabular-nums">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </Tooltip>

        {hasData && (
          <div className="hidden items-center gap-1.5 md:flex">
            <Tooltip content="Exportar a Excel respetando filtros" side="bottom">
              <button
                onClick={() => {
                  exportExcel(filtered);
                  toast.success(`Se exportaron ${filtered.length} registros a Excel`);
                }}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-line bg-surface/40 text-ink-soft transition-all duration-300 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 hover:shadow-glow-emerald"
                aria-label="Exportar Excel"
              >
                <FileSpreadsheet className="size-4" />
              </button>
            </Tooltip>
            <Tooltip content="Exportar a CSV respetando filtros" side="bottom">
              <button
                onClick={() => {
                  exportCSV(filtered);
                  toast.success(`Se exportaron ${filtered.length} registros a CSV`);
                }}
                className="inline-flex size-10 items-center justify-center rounded-xl border border-line bg-surface/40 text-ink-soft transition-all duration-300 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 hover:shadow-glow-cyan"
                aria-label="Exportar CSV"
              >
                <FileDown className="size-4" />
              </button>
            </Tooltip>
          </div>
        )}

        {uploadMeta && (
          <div className="hidden items-center gap-1.5 rounded-full border border-line bg-surface/50 px-3 py-1.5 text-[11px] font-semibold text-ink-soft lg:flex">
            <Clock3 className="size-3.5 text-brand-400" />
            Últ. actualización: {formatISOToDisplay(uploadMeta.uploadedAt)}
          </div>
        )}

        <Tooltip content={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} side="bottom">
          <button
            onClick={toggleTheme}
            className={cn(
              'relative inline-flex size-10 items-center justify-center overflow-hidden rounded-xl border text-ink-soft transition-all duration-300 hover:text-ink',
              theme === 'dark'
                ? 'border-brand-500/30 bg-brand-500/10 text-brand-300 shadow-glow-sm hover:border-brand-400/50'
                : 'border-line bg-surface/40',
            )}
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <MoonStar className="size-4" />}
          </button>
        </Tooltip>

        <div className="relative ml-1 hidden items-center gap-2 rounded-xl border border-line bg-surface/40 py-1 pr-3 pl-1 sm:flex">
          <div className="flex size-8 items-center justify-center rounded-lg gradient-brand text-xs font-bold text-white shadow-glow-sm">
            IN
          </div>
          <div className="leading-tight">
            <p className="text-xs font-bold text-ink">Ingresos y</p>
            <p className="text-[10px] font-medium text-ink-soft">Capacitación</p>
          </div>
        </div>
      </div>

      <FilterDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </header>
  );
}