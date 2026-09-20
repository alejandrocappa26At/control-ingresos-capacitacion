'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, ListChecks, Search, Users, X } from 'lucide-react';
import { cn, normalizeKey } from '@/lib/utils';

interface CapacitadorMultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  options: string[];
}

const ESTIMATED_LIST_HEIGHT = 460;

interface DropdownPos {
  top: number;
  left: number;
  width: number;
}

export function CapacitadorMultiSelect({ value, onChange, options }: CapacitadorMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = normalizeKey(query).trim();
    if (!q) return options;
    return options.filter((o) => normalizeKey(o).includes(q));
  }, [options, query]);

  const computePos = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < ESTIMATED_LIST_HEIGHT && spaceAbove > spaceBelow;
    const top = openUp ? Math.max(8, rect.top - ESTIMATED_LIST_HEIGHT) : rect.bottom + 6;
    const width = Math.min(Math.max(rect.width, 320), window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    setPos({ top, left, width });
  }, []);

  useEffect(() => {
    if (!open) return;
    computePos();
    searchRef.current?.focus();
    window.addEventListener('resize', computePos);
    window.addEventListener('scroll', computePos, true);
    return () => {
      window.removeEventListener('resize', computePos);
      window.removeEventListener('scroll', computePos, true);
    };
  }, [open, computePos]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (listRef.current && !listRef.current.contains(target)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function toggle(name: string) {
    if (selected.has(name)) onChange(value.filter((v) => v !== name));
    else onChange([...value, name]);
  }

  const listbox = open && pos ? (
    <div
      ref={listRef}
      role="listbox"
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
      className="animate-fade-in overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card"
    >
      <div className="relative p-2">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-ink-soft" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar capacitador..."
          className="h-9 w-full rounded-lg border border-line bg-surface-2 pr-3 pl-8 text-sm text-ink placeholder:text-ink-soft transition-all duration-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
        />
      </div>

      <div className="flex items-center gap-1 border-t border-line px-1.5 py-1.5">
        <button
          type="button"
          onClick={() => onChange(Array.from(new Set([...value, ...options])))}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-brand-600 transition-colors hover:bg-surface-3 hover:text-brand-700"
        >
          <ListChecks className="size-3.5" />
          Seleccionar todos
        </button>
        <button
          type="button"
          onClick={() => {
            onChange([]);
            setQuery('');
          }}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-ink-soft transition-colors hover:bg-surface-3 hover:text-ink"
        >
          <X className="size-3.5" />
          Limpiar selección
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto border-t border-line p-1.5">
        {filtered.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-ink-soft">
            {options.length === 0 ? 'No hay capacitadores disponibles.' : 'Sin resultados.'}
          </p>
        )}
        {filtered.map((opt) => {
          const checked = selected.has(opt);
          return (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-3"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt)}
                className="sr-only"
              />
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-md border transition-all duration-200',
                  checked
                    ? 'border-brand-500/30 bg-brand-50 text-brand-600'
                    : 'border-line-2 bg-surface-2 text-transparent',
                )}
              >
                <Check className="size-3" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{opt}</span>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-line bg-surface-3/40 px-3 py-2">
        <span className="text-[11px] font-semibold text-ink-soft">
          Capacitadores seleccionados:{' '}
          <span className="font-bold text-ink">{value.length}</span>
        </span>
        {options.length > 0 && value.length === options.length && (
          <span className="text-[11px] font-semibold text-brand-400">Todos</span>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'relative flex h-10 w-full cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface-2 px-3.5 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500/25',
          open ? 'border-brand-400/70 bg-surface-2' : 'hover:bg-surface-2',
        )}
      >
        <Users className="size-4 shrink-0 text-ink-soft" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {value.length === 0 ? (
            <span className="text-ink-soft">Todos los capacitadores</span>
          ) : value.length === 1 ? (
            <span className="text-ink">{value[0]}</span>
          ) : (
            <span className="text-ink">{value.length} capacitadores seleccionados</span>
          )}
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-ink-soft transition-transform duration-300', open && 'rotate-180')} />
      </button>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.slice(0, 3).map((name) => (
            <span
              key={name}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              <span className="truncate">{name}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== name))}
                aria-label={`Quitar ${name}`}
                className="flex size-3.5 shrink-0 items-center justify-center rounded-full text-brand-700/70 transition-colors hover:bg-brand-500/25 hover:text-brand-800"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          {value.length > 3 && (
            <span className="inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft">
              +{value.length - 3} más
            </span>
          )}
        </div>
      )}

      {pos && typeof document !== 'undefined' && createPortal(listbox, document.body)}
    </div>
  );
}