'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eraser, ListChecks, Search, X, type LucideIcon } from 'lucide-react';
import { cn, formatNumber, normalizeKey } from '@/lib/utils';

export interface ResultOption {
  value: string;
  label: string;
  count: number;
}

interface ResultsFilterProps {
  label: string;
  icon: LucideIcon;
  options: ResultOption[];
  value: string[];
  onChange: (next: string[]) => void;
  emptyLabel: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  countToken: string;
}

export function ResultsFilter({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  emptyLabel,
  searchable = false,
  searchPlaceholder = 'Buscar...',
  countToken,
}: ResultsFilterProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalizeKey(query).trim();
    if (!q) return options;
    return options.filter((o) => normalizeKey(o.label).includes(q) || normalizeKey(o.value).includes(q));
  }, [options, query]);

  const selectedCount = options.filter((o) => value.includes(o.value)).length;
  const allSelected = options.length > 0 && selectedCount === options.length;
  const hasQuery = normalizeKey(query).trim().length > 0;

  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  return (
    <div className="rounded-xl border border-line bg-surface/40 p-3 transition-colors duration-300 hover:border-brand-500/25">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-gradient-to-b from-brand-500/25 to-brand-500/5 text-brand-400">
          <Icon className="size-3.5" />
        </span>
        <span className="truncate text-[11px] font-bold tracking-wider text-ink uppercase">{label}</span>

        {value.length > 0 ? (
          <>
            <span className="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md gradient-brand px-1.5 text-[10px] font-bold text-white shadow-glow-sm tabular-nums">
              {value.length}
            </span>
            <button
              type="button"
              onClick={() => onChange([])}
              aria-label={`Limpiar ${label}`}
              className="flex size-5 shrink-0 items-center justify-center rounded-md text-ink-soft transition-colors duration-200 hover:bg-[#e30613]/20 hover:text-[#ff8a8a]"
            >
              <Eraser className="size-3.5" />
            </button>
          </>
        ) : (
          <span className="ml-auto shrink-0 text-[10px] font-semibold text-ink-muted">{emptyLabel}</span>
        )}
      </div>

      {searchable && (
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-8 w-full rounded-lg border border-line bg-surface-2 pr-7 pl-8 text-xs text-ink placeholder:text-ink-soft transition-all duration-300 focus:border-brand-400/70 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute top-1/2 right-2 flex size-4 -translate-y-1/2 items-center justify-center rounded text-ink-soft transition-colors hover:text-ink"
            >
              <Eraser className="size-3" />
            </button>
          )}
        </div>
      )}

      {searchable && options.length > 4 && (
        <button
          type="button"
          onClick={() =>
            allSelected ? onChange([]) : onChange(Array.from(new Set([...value, ...filtered.map((o) => o.value)])))
          }
          className={cn(
            'mb-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold transition-all duration-200',
            allSelected ? 'text-ink-soft hover:bg-surface-3 hover:text-ink' : 'text-brand-400 hover:bg-brand-500/10 hover:text-brand-300',
          )}
        >
          <ListChecks className="size-3" />
          {allSelected ? 'Desmarcar todo' : 'Marcar todo'}
        </button>
      )}

      <div className="max-h-52 space-y-1 overflow-y-auto pr-0.5">
        {filtered.length === 0 && (
          <p className="px-1 py-4 text-center text-[11px] text-ink-soft">
            {options.length === 0 ? `No hay ${countToken} disponibles.` : 'Sin resultados.'}
          </p>
        )}

        {filtered.map((option) => {
          const checked = value.includes(option.value);
          return (
            <motion.label
              key={option.value}
              initial={false}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.985 }}
              className={cn(
                'group/opt flex cursor-pointer items-center gap-2.5 rounded-lg border px-2 py-1.5 transition-all duration-200',
                checked
                  ? 'border-[#e30613]/35 bg-[#e30613]/10 shadow-[0_0_18px_-8px_rgba(227,6,19,0.7)]'
                  : 'border-transparent hover:border-line hover:bg-surface-3',
              )}
            >
              <input type="checkbox" checked={checked} onChange={() => toggle(option.value)} className="sr-only" />

              <span
                className={cn(
                  'relative flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-all duration-200',
                  checked
                    ? 'border-[#e30613]/60 bg-[#e30613] shadow-[0_0_12px_-2px_rgba(227,6,19,0.9)]'
                    : 'border-line-2 bg-surface-2 group-hover/opt:border-brand-400/60',
                )}
              >
                <motion.span
                  initial={false}
                  animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 26 }}
                >
                  <Check className="size-3 text-white" strokeWidth={3} />
                </motion.span>
              </span>

              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-xs font-semibold transition-colors duration-200',
                  checked ? 'text-ink' : 'text-ink-soft group-hover/opt:text-ink',
                )}
              >
                {option.label}
              </span>

              <span
                className={cn(
                  'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition-colors duration-200',
                  checked ? 'bg-[#e30613]/15 text-brand-300' : 'bg-surface-3 text-ink-muted',
                )}
              >
                {formatNumber(option.count)}
              </span>
            </motion.label>
          );
        })}
      </div>

      <AnimatePresence>
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
              {value.map((v) => {
                const option = options.find((o) => o.value === v);
                return (
                  <span
                    key={v}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#e30613]/30 bg-[#e30613]/12 py-0.5 pr-1 pl-2.5 text-[11px] font-semibold text-brand-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  >
                    <span className="truncate">{option?.label ?? v}</span>
                    <button
                      type="button"
                      onClick={() => toggle(v)}
                      aria-label={`Quitar ${option?.label ?? v}`}
                      className="flex size-3.5 shrink-0 items-center justify-center rounded-full text-brand-300/70 transition-colors hover:bg-[#e30613]/30 hover:text-white"
                    >
                      <X className="size-3" strokeWidth={3} />
                    </button>
                  </span>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
