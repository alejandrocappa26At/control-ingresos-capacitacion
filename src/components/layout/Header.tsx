'use client';

import { useEffect, useState } from 'react';
import { Flame, PanelLeftClose, PanelLeftOpen, Search, ChevronRight, Home, X } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useDebounce } from '@/hooks/useDebounce';
import { usePathname } from 'next/navigation';
import { formatNumber } from '@/lib/utils';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/capacitacion': 'Capacitación',
  '/caidas': 'Análisis de Caídas',
  '/upload': 'Cargar Excel',
};

export function Header() {
  const pathname = usePathname();
  const collapsed = useDataStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useDataStore((s) => s.toggleSidebar);
  const setSearchTerm = useDataStore((s) => s.setSearchTerm);
  const records = useDataStore((s) => s.records);
  const activeFiltersCount = useDataStore((s) => s.activeFiltersCount);
  const openFilterDrawer = useDataStore((s) => s.openFilterDrawer);
  const sessionUser = useSessionStore((s) => s.user);

  const [value, setValue] = useState('');
  const debounced = useDebounce(value, 250);

  useEffect(() => {
    setSearchTerm(debounced);
  }, [debounced, setSearchTerm]);

  const title = TITLES[pathname] ?? 'Control de Ingresos y Capacitación';
  const isHome = pathname === '/';

  return (
    <header className="glass-strong sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line px-4 sm:px-6">
      <button
        onClick={toggleSidebar}
        className="inline-flex size-10 items-center justify-center rounded-xl text-ink-soft transition-all duration-300 hover:bg-surface-3 hover:text-ink"
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
        <button
          onClick={openFilterDrawer}
          aria-label={`Abrir filtros avanzados · ${activeFiltersCount} activo${activeFiltersCount === 1 ? '' : 's'}`}
          className="group relative inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-[linear-gradient(135deg,#e30613,#ff4d4f)] px-2.5 shadow-[0_0_18px_rgba(227,6,19,0.4)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-white/40 hover:shadow-[0_0_32px_rgba(227,6,19,0.65)] active:translate-y-0 active:scale-[0.98] sm:px-3"
        >
          <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-black/15 to-white/10" />
          <Flame className="relative size-4 shrink-0 text-white drop-shadow-sm" />
          <span className="relative hidden min-w-0 text-left leading-tight sm:block">
            <span className="block truncate text-xs font-extrabold tracking-wide text-white">FILTROS AVANZADOS</span>
            <span className="block truncate text-[10px] font-semibold text-white/85 tabular-nums">
              {formatNumber(records.length)} registros
            </span>
          </span>
          <span className="relative shrink-0 rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums backdrop-blur-sm">
            {activeFiltersCount}
            <span className="hidden lg:inline"> activo{activeFiltersCount === 1 ? '' : 's'}</span>
          </span>
        </button>

        <div className="relative w-44 md:w-80">
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

        <div className="relative ml-1 hidden items-center gap-2 rounded-xl border border-line bg-surface-2 py-1 pr-3 pl-1 shadow-card sm:flex">
          <div className="relative">
            <div className="flex size-8 items-center justify-center rounded-lg gradient-brand text-xs font-bold text-white">
              {sessionUser ? sessionUser.slice(0, 2).toUpperCase() : 'IN'}
            </div>
            <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-surface-2 bg-emerald-400" />
          </div>
          <div className="leading-tight">
            <p className="max-w-[9rem] truncate text-xs font-bold text-ink">{sessionUser ?? 'Operador'}</p>
            <p className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
              <span className="size-1 rounded-full bg-emerald-400" />
              En línea
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}