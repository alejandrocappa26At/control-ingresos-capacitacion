'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import {
  LayoutDashboard,
  GraduationCap,
  TrendingDown,
  PanelLeftOpen,
  ChevronsLeft,
  PresentationIcon,
  LogOut,
  FileSpreadsheet,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { useSessionStore } from '@/store/useSessionStore';
import { computeKpis } from '@/services/analytics/kpis';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

type Tone = 'amber' | 'red';

const BADGE_TONES: Record<Tone, { chip: string; dot: string }> = {
  amber: { chip: 'bg-amber-500/15 text-amber-400 ring-amber-500/30', dot: 'bg-amber-400' },
  red: { chip: 'bg-red-500/15 text-red-400 ring-red-500/30', dot: 'bg-red-400' },
};

interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  filters?: boolean;
  badge?: Tone;
}

const NAV_SECTIONS: Array<{ section: string; items: NavItem[] }> = [
  {
    section: 'Análisis',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Operaciones',
    items: [
      { href: '/capacitacion', label: 'Capacitación', icon: GraduationCap, badge: 'amber' },
    ],
  },
  {
    section: 'Control',
    items: [
      { href: '/caidas', label: 'Caídas', icon: TrendingDown, badge: 'red' },
      { filters: true, label: 'Filtros', icon: SlidersHorizontal },
      { href: '/upload', label: 'Importar Excel', icon: FileSpreadsheet },
    ],
  },
];

function formatCount(n: number): string {
  if (n === 0) return '0';
  return n > 99 ? '99+' : String(n);
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useDataStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useDataStore((s) => s.toggleSidebar);
  const records = useDataStore((s) => s.records);
  const filterDrawerOpen = useDataStore((s) => s.filterDrawerOpen);
  const openFilterDrawer = useDataStore((s) => s.openFilterDrawer);
  const activeFiltersCount = useDataStore((s) => s.activeFiltersCount);
  const sessionUser = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);

  const asideRef = useRef<HTMLElement | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 180, damping: 24, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 180, damping: 24, mass: 0.6 });
  const cursorGlow = useMotionTemplate`radial-gradient(340px circle at ${sx}px ${sy}px, rgba(255,39,53,0.14), transparent 62%)`;

  const badges = useMemo(() => {
    if (!records.length) return { capacitacion: 0, caidas: 0 };
    const kpi = computeKpis(records);
    return {
      capacitacion: kpi.enCapacitacion,
      caidas: kpi.noPasanAOperaciones,
    };
  }, [records]);

  const badgeCount = (item: NavItem): number => {
    if (item.filters) return activeFiltersCount;
    if (!item.badge) return 0;
    return item.badge === 'amber' ? badges.capacitacion : badges.caidas;
  };

  const itemChip = (isFilters: boolean) =>
    isFilters
      ? { chip: 'bg-brand-500/15 text-brand-300 ring-brand-500/30', dot: 'bg-brand-400' }
      : null;

  return (
    <motion.aside
      ref={asideRef}
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={(e) => {
        const rect = asideRef.current?.getBoundingClientRect();
        if (!rect) return;
        mx.set(e.clientX - rect.left);
        my.set(e.clientY - rect.top);
      }}
      className={cn(
        'glass-strong fixed top-0 left-0 z-40 flex h-dvh flex-col overflow-hidden border-r border-line/70 shadow-[8px_0_40px_-18px_rgba(0,0,0,0.55)] transition-[width] duration-300 ease-out',
        collapsed ? 'w-[76px]' : 'w-[248px]',
      )}
    >
      {/* Aurora sutil interna */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute -top-16 -right-10 size-52 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle at 40% 40%, rgba(227,6,19,0.24), transparent 68%)', filter: 'blur(46px)', animation: 'aurora-drift 26s ease-in-out infinite alternate' }}
        />
        <div
          className="absolute -bottom-20 -left-14 size-56 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle at 60% 40%, rgba(255,39,53,0.15), transparent 66%)', filter: 'blur(52px)', animation: 'aurora-drift 32s ease-in-out infinite alternate-reverse' }}
        />
      </div>

      {/* Cursor glow */}
      <motion.div className="pointer-events-none absolute inset-0 z-0" style={{ background: cursorGlow }} />

      {/* Sheen superior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-1/2 bg-gradient-to-b from-white/[0.05] to-transparent" />
      {/* Hairline borde superior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      {/* Borde luminoso derecho */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 w-px bg-gradient-to-b from-transparent via-brand-500/40 to-transparent" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Logo */}
        <div className={cn('flex items-center gap-3 px-4 pt-6 pb-5', collapsed && 'justify-center px-2')}>
          <motion.div
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex size-10 shrink-0 items-center justify-center rounded-xl gradient-brand text-white shadow-glow"
          >
            <PresentationIcon className="size-5" />
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-canvas" style={{ boxShadow: '0 0 10px rgba(16,185,129,0.9)' }} />
          </motion.div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-ink">Control de Ingresos</p>
              <p className="truncate text-[11px] font-medium text-ink-soft">y Capacitación</p>
              <div className="mt-1 h-px w-16 bg-gradient-to-r from-brand-500/80 to-transparent" />
            </div>
          )}
        </div>

        {/* Navegación por categorías */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          {NAV_SECTIONS.map(({ section, items }) => (
            <div key={section} className="mb-2">
              <div className={cn('flex items-center gap-2 px-3 pt-4 pb-2', collapsed && 'items-center justify-center px-0 pt-3 pb-1')}>
                {!collapsed ? (
                  <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] text-ink-muted uppercase">
                    <span className="h-px w-4 bg-gradient-to-r from-brand-500/70 to-transparent" />
                    {section}
                  </div>
                ) : (
                  <span className="h-px w-8 rounded bg-gradient-to-r from-white/20 to-transparent" />
                )}
              </div>

              <div className="space-y-1">
                {items.map((item) => {
                  const isFilters = item.filters === true;
                  const active = isFilters
                    ? filterDrawerOpen
                    : item.href != null && (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));
                  const count = badgeCount(item);
                  const tone = item.badge ? BADGE_TONES[item.badge] : null;
                  const chip = itemChip(isFilters);

                  const inner = (
                    <>
                      {active && (
                        <>
                          <motion.span
                            layoutId="sidebar-active-pill"
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 rounded-xl border border-brand-400/20 bg-gradient-to-r from-brand-500/18 to-brand-500/5 shadow-glow-sm"
                          />
                          <motion.span
                            layoutId="sidebar-active-line"
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-y-2.5 left-0 w-[3px] rounded-r-full gradient-brand"
                            style={{ boxShadow: '0 0 14px rgba(227,6,19,0.95), 0 0 4px rgba(255,39,53,0.7)' }}
                          />
                        </>
                      )}

                      <span
                        className={cn(
                          'relative flex size-8 shrink-0 items-center justify-center rounded-[10px] border transition-all duration-300',
                          active
                            ? 'border-brand-400/40 bg-brand-500/15 text-brand-200 shadow-[0_0_16px_rgba(227,6,19,0.45)]'
                            : 'border-white/10 bg-white/[0.05] text-ink-muted group-hover:border-brand-400/25 group-hover:text-brand-300',
                        )}
                      >
                        <item.icon className="size-[17px] transition-transform duration-300 group-hover:scale-110" />
                        {collapsed && count > 0 && (
                          <span
                            className={cn(
                              'absolute -top-1.5 -right-1.5 flex min-w-4 items-center justify-center rounded-full border border-canvas px-1 py-px text-[9px] font-bold ring-1 tabular-nums',
                              tone?.chip ?? chip?.chip,
                            )}
                          >
                            {formatCount(count)}
                          </span>
                        )}
                      </span>

                      {!collapsed && (
                        <span className={cn('truncate text-sm font-semibold', active && 'text-glow')}>{item.label}</span>
                      )}

                      {!collapsed && count > 0 && (
                        <span className={cn('ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset tabular-nums', tone?.chip ?? chip?.chip)}>
                          <span className={cn('size-1.5 rounded-full animate-pulse-glow', tone?.dot ?? chip?.dot)} />
                          {formatCount(count)}
                        </span>
                      )}
                    </>
                  );

                  const classes = cn(
                    'group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-300 ease-out',
                    active
                      ? 'text-white'
                      : 'text-ink-soft hover:translate-x-1 hover:bg-white/[0.04] hover:text-ink',
                    collapsed && 'justify-center px-0 hover:translate-x-0',
                  );

                  const content = isFilters ? (
                    <button
                      key="filtros-action"
                      type="button"
                      onClick={openFilterDrawer}
                      className={classes}
                      aria-label={`Abrir panel de filtros · ${count} activo${count === 1 ? '' : 's'}`}
                    >
                      {inner}
                    </button>
                  ) : (
                    <Link key={item.href} href={item.href!} className={classes}>
                      {inner}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={isFilters ? 'filtros' : item.href} content={item.label} side="right">
                        {content}
                      </Tooltip>
                    );
                  }
                  return <div key={isFilters ? 'filtros' : item.href}>{content}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-line/80 p-3">
          <div className={cn('flex items-center gap-2', collapsed && 'flex-col gap-2')}>
            <div className="relative shrink-0">
              <div className="flex size-9 items-center justify-center rounded-xl gradient-brand text-xs font-bold text-white shadow-glow-sm">
                {sessionUser ? sessionUser.slice(0, 2).toUpperCase() : 'CA'}
              </div>
              <span
                className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-canvas bg-emerald-400"
                style={{ boxShadow: '0 0 8px rgba(16,185,129,0.9)' }}
              />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-ink">{sessionUser ?? 'capacitacion'}</p>
                <p className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                  <span className="size-1 animate-pulse-glow rounded-full bg-emerald-400 shadow-[0_0_6px_currentColor]" />
                  En línea
                </p>
              </div>
            )}

            <div className={cn('flex shrink-0 items-center gap-1.5', collapsed && 'flex-col')}>
              <Tooltip content={collapsed ? 'Expandir menú' : 'Colapsar menú'} side={collapsed ? 'right' : 'left'}>
                <button
                  onClick={toggleSidebar}
                  aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-white/[0.03] text-ink-soft transition-all duration-300 hover:scale-105 hover:border-brand-400/40 hover:bg-brand-500/10 hover:text-brand-300 hover:shadow-glow-sm active:scale-95"
                >
                  {collapsed ? <PanelLeftOpen className="size-4" /> : <ChevronsLeft className="size-4" />}
                </button>
              </Tooltip>
              <Tooltip content="Cerrar sesión" side={collapsed ? 'right' : 'left'}>
                <button
                  onClick={logout}
                  aria-label="Cerrar sesión"
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line bg-white/[0.03] text-ink-soft transition-all duration-300 hover:scale-105 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-400 hover:shadow-glow-sm active:scale-95"
                >
                  <LogOut className="size-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}