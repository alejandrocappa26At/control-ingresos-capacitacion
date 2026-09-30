'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState, type FocusEvent } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  LayoutDashboard,
  GraduationCap,
  TrendingDown,
  LogOut,
  FileSpreadsheet,
  BrainCircuit,
  DatabaseZap,
  Pin,
  type LucideIcon,
} from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { computeKpis } from '@/services/analytics/kpis';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

export const SIDEBAR_RAIL = 76;
export const SIDEBAR_EXPANDED = 248;

const EASE = [0.16, 1, 0.3, 1] as const;

type Tone = 'amber' | 'red';

const BADGE_TONES: Record<Tone, { chip: string; dot: string }> = {
  amber: { chip: 'bg-amber-500/15 text-amber-300 ring-amber-400/30', dot: 'bg-amber-400' },
  red: { chip: 'bg-red-500/15 text-red-300 ring-red-400/30', dot: 'bg-red-500' },
};

interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  badge?: Tone;
}

const NAV_SECTIONS: Array<{ section: string; icon: LucideIcon; color: 'red' | 'amber'; items: NavItem[] }> = [
  {
    section: 'ANÁLISIS ESTRATÉGICO',
    icon: BrainCircuit,
    color: 'red',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/capacitacion', label: 'Capacitación', icon: GraduationCap, badge: 'amber' },
      { href: '/caidas', label: 'Caídas', icon: TrendingDown, badge: 'red' },
    ],
  },
  {
    section: 'GESTIÓN DE DATOS',
    icon: DatabaseZap,
    color: 'amber',
    items: [{ href: '/upload', label: 'Importar Excel', icon: FileSpreadsheet }],
  },
];

function formatCount(n: number): string {
  if (n === 0) return '0';
  return n > 99 ? '99+' : String(n);
}

export function Sidebar() {
  const pathname = usePathname();
  const pinned = useDataStore((s) => s.sidebarPinned);
  const togglePinned = useDataStore((s) => s.toggleSidebarPinned);
  const records = useDataStore((s) => s.records);
  const sessionUser = useSessionStore((s) => s.user);
  const logout = useSessionStore((s) => s.logout);

  const compact = useMediaQuery('(max-width: 767px)');
  const isPinned = pinned && !compact;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  const expanded = isPinned || (!compact && (hovered || focused));
  const collapsed = !expanded;

  const badges = useMemo(() => {
    if (!records.length) return { capacitacion: 0, caidas: 0 };
    const kpi = computeKpis(records);
    return {
      capacitacion: kpi.enCapacitacion,
      caidas: kpi.desercion + kpi.bajasCapacitacion,
    };
  }, [records]);

  const badgeCount = (item: NavItem): number => {
    if (!item.badge) return 0;
    return item.badge === 'amber' ? badges.capacitacion : badges.caidas;
  };

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
  };

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: expanded ? SIDEBAR_EXPANDED : SIDEBAR_RAIL }}
      transition={{ default: { duration: 0.4, ease: EASE }, width: { duration: 0.32, ease: EASE } }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setFocused(false);
      }}
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
      aria-label="Navegación principal"
      className={cn(
        'fixed top-0 left-0 z-40 flex h-dvh flex-col overflow-hidden border-r border-line bg-surface-2/95 backdrop-blur-xl',
        !isPinned && 'shadow-[8px_0_40px_-20px_rgba(0,0,0,0.55)]',
        isPinned && 'shadow-[10px_0_50px_-24px_rgba(227,6,19,0.45)]',
      )}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-20 w-px bg-gradient-to-b from-transparent via-[#e30613] to-transparent"
        initial={false}
        animate={{ opacity: isPinned ? 1 : 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {/* Logo */}
        <div className={cn('flex items-center gap-3 px-4 pt-6 pb-5', collapsed && 'justify-center px-2')}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg"
            style={{ width: '70px', height: '70px' }}
          >
            <Image
              src="/logo1at.jpg"
              alt="Logo"
              width={70}
              height={70}
              priority
              className="object-cover"
              unoptimized
            />
          </motion.div>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.1, ease: EASE }}
              className="min-w-0"
            >
              <p className="truncate text-sm font-bold tracking-tight text-ink">Control de Ingresos</p>
              <p className="truncate text-[11px] font-medium text-ink-soft">y Capacitación</p>
              <div className="mt-1 h-px w-16 bg-gradient-to-r from-brand-500/60 to-transparent" />
            </motion.div>
          )}
        </div>

        {/* Navegación por categorías */}
        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2">
          {NAV_SECTIONS.map(({ section, icon: SectionIcon, color, items }) => (
            <div key={section} className="mb-2">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 pt-4 pb-2',
                  collapsed && 'items-center justify-center px-0 pt-3 pb-1',
                )}
              >
                <div
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-lg border shadow-[0_0_16px_-4px_rgba(227,6,19,0.25)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_-2px_rgba(227,6,19,0.4)]',
                    color === 'red'
                      ? 'border-red-500/20 bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent'
                      : 'border-amber-500/20 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent',
                  )}
                >
                  <SectionIcon className={cn('size-3.5', color === 'red' ? 'text-red-400' : 'text-amber-400')} />
                </div>

                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.1, ease: EASE }}
                    className="min-w-0"
                  >
                    <p className="truncate text-[10px] font-bold tracking-[0.18em] text-ink-muted uppercase">{section}</p>
                    <div className="mt-0.5 h-px w-12 bg-gradient-to-r from-brand-500/60 to-transparent" />
                  </motion.div>
                )}
              </div>

              <div className="space-y-1">
                {items.map((item) => {
                  const active =
                    item.href != null && (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));
                  const count = badgeCount(item);
                  const tone = item.badge ? BADGE_TONES[item.badge] : null;

                  const inner = (
                    <>
                      {active && (
                        <motion.span
                          layoutId="sidebar-active-pill"
                          transition={{ duration: 0.3, ease: EASE }}
                          className="absolute inset-0 rounded-xl border border-red-500/25 bg-red-500/20 shadow-[0_0_24px_-6px_rgba(227,6,19,0.45)]"
                        />
                      )}

                      <span
                        className={cn(
                          'relative flex size-8 shrink-0 items-center justify-center rounded-[10px] border transition-all duration-300',
                          active
                            ? 'border-red-500/30 bg-red-500/15 text-red-300 shadow-[0_0_18px_-4px_rgba(227,6,19,0.45)]'
                            : 'border-transparent text-ink-muted group-hover:bg-red-500/15 group-hover:text-red-400',
                        )}
                      >
                        <item.icon className="size-[17px] transition-transform duration-300 group-hover:scale-110" />
                        {collapsed && count > 0 && (
                          <span
                            className={cn(
                              'absolute -top-1.5 -right-1.5 flex min-w-4 items-center justify-center rounded-full border border-surface-2 px-1 py-px text-[9px] font-bold tabular-nums ring-1',
                              tone?.chip,
                            )}
                          >
                            {formatCount(count)}
                          </span>
                        )}
                      </span>

                      {expanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: 0.12, ease: EASE }}
                          className={cn(
                            'truncate text-sm font-semibold whitespace-nowrap',
                            active && 'text-red-300',
                          )}
                        >
                          {item.label}
                        </motion.span>
                      )}

                      {expanded && count > 0 && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: 0.16, ease: EASE }}
                          className={cn(
                            'ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ring-1 ring-inset',
                            tone?.chip,
                          )}
                        >
                          <span className={cn('size-1.5 rounded-full', tone?.dot)} />
                          {formatCount(count)}
                        </motion.span>
                      )}
                    </>
                  );

                  const classes = cn(
                    'group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 whitespace-nowrap transition-all duration-200 ease-out',
                    active ? 'text-brand-300' : 'text-ink-soft hover:bg-surface-3 hover:text-ink',
                    collapsed && 'justify-center px-0 hover:bg-transparent',
                  );

                  const link = (
                    <Link key={item.href} href={item.href!} className={classes}>
                      {inner}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href} content={item.label} side="right" wrapperClassName="w-full">
                        {link}
                      </Tooltip>
                    );
                  }
                  return <div key={item.href}>{link}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-line p-3">
          <div className={cn('flex items-center gap-2.5', collapsed && 'flex-col gap-2')}>
            {collapsed ? (
              <Tooltip content={sessionUser ?? 'Sesión activa'} side="right">
                <div className="relative shrink-0">
                  <div className="flex size-9 items-center justify-center rounded-xl gradient-brand text-xs font-bold text-white">
                    {sessionUser ? sessionUser.slice(0, 2).toUpperCase() : 'CA'}
                  </div>
                  <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-surface-2 bg-emerald-400" />
                </div>
              </Tooltip>
            ) : (
              <div className="relative shrink-0">
                <div className="flex size-9 items-center justify-center rounded-xl gradient-brand text-xs font-bold text-white">
                  {sessionUser ? sessionUser.slice(0, 2).toUpperCase() : 'CA'}
                </div>
                <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-surface-2 bg-emerald-400" />
              </div>
            )}

            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.1, ease: EASE }}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-xs font-bold text-ink">{sessionUser ?? 'capacitacion'}</p>
                <p className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                  <span className="size-1 rounded-full bg-emerald-400" />
                  En línea
                </p>
              </motion.div>
            )}

            {expanded ? (
              <button
                onClick={logout}
                aria-label="Cerrar sesión"
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line text-ink-soft transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-400 active:scale-95"
              >
                <LogOut className="size-4" />
              </button>
            ) : (
              <Tooltip content="Cerrar sesión" side="right">
                <button
                  onClick={logout}
                  aria-label="Cerrar sesión"
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line text-ink-soft transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-400 active:scale-95"
                >
                  <LogOut className="size-4" />
                </button>
              </Tooltip>
            )}
          </div>

          <PinControl pinned={isPinned} collapsed={collapsed} onToggle={togglePinned} />
        </div>
      </div>
    </motion.aside>
  );
}

function PinControl({ pinned, collapsed, onToggle }: { pinned: boolean; collapsed: boolean; onToggle: () => void }) {
  const button = (
    <button
      onClick={onToggle}
      aria-pressed={pinned}
      aria-label={pinned ? 'Liberar menú' : 'Fijar menú'}
      className={cn(
        'group/pin relative flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border transition-all duration-300 ease-out active:scale-[0.97]',
        collapsed ? 'size-9' : 'h-10 w-full px-3',
        pinned
          ? 'gradient-brand border-white/25 text-white shadow-[0_0_22px_-4px_rgba(227,6,19,0.75)]'
          : 'border-[#e30613]/40 bg-[#e30613]/10 text-[#ff8a8a] hover:border-[#e30613]/70 hover:bg-[#e30613]/18 hover:text-white hover:shadow-[0_0_20px_-8px_rgba(227,6,19,0.6)]',
      )}
    >
      <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-white/10 opacity-0 transition-opacity duration-300 group-hover/pin:opacity-100" />
      {pinned && (
        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
      )}
      <Pin
        className={cn(
          'relative size-4 shrink-0 transition-transform duration-300',
          pinned && 'rotate-0',
          !pinned && '-rotate-45 group-hover/pin:rotate-0',
        )}
      />
      {!collapsed && (
        <span className="relative truncate text-xs font-bold tracking-wide">
          {pinned ? 'Menú fijado' : 'Fijar menú'}
        </span>
      )}
    </button>
  );

  if (!collapsed) return <div className="mt-2.5">{button}</div>;

  return (
    <div className="mt-2 flex justify-center">
      <Tooltip content={pinned ? 'Liberar menú' : 'Fijar menú'} side="right">
        {button}
      </Tooltip>
    </div>
  );
}
