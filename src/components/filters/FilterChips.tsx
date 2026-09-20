'use client';

import { useMemo } from 'react';
import { Calendar, SlidersHorizontal, X } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { describeActiveFilters } from '@/lib/filterDescriptions';
import { cn } from '@/lib/utils';

export function FilterChips() {
  const filters = useDataStore((s) => s.filters);
  const setFilters = useDataStore((s) => s.setFilters);
  const resetFilters = useDataStore((s) => s.resetFilters);

  const chips = useMemo(() => describeActiveFilters(filters), [filters]);
  if (chips.length === 0) return null;

  return (
    <div className="relative z-20 border-b border-line/60 bg-canvas/60 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 sm:px-6 lg:px-8">
        <span className="mr-1 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-ink-soft uppercase">
          <SlidersHorizontal className="size-3 text-brand-600" />
          Filtros activos
        </span>
        {chips.map((chip) =>
          chip.kind === 'date' ? (
            <span
              key={chip.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-white py-1 pr-1.5 pl-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-rose-500/40 hover:text-rose-600"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Calendar className="size-3" />
              </span>
              <span className="truncate">{chip.label}</span>
              <button
                type="button"
                onClick={() => setFilters(chip.remove(filters))}
                aria-label={`Quitar filtro de fecha: ${chip.label}`}
                className="ml-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="size-3" />
              </button>
            </span>
          ) : (
            <span
              key={chip.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-white py-1 pr-1.5 pl-2.5 text-xs font-semibold text-ink-soft transition-colors hover:border-rose-500/40 hover:text-rose-600"
            >
              <span className="truncate">{chip.label}</span>
              <button
                type="button"
                onClick={() => setFilters(chip.remove(filters))}
                aria-label={`Quitar filtro: ${chip.label}`}
                className="flex size-4 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="size-3" />
              </button>
            </span>
          ),
        )}
        <button
          type="button"
          onClick={resetFilters}
          className={cn(
            'ml-auto inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-bold text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink',
          )}
        >
          LIMPIAR TODO
        </button>
      </div>
    </div>
  );
}