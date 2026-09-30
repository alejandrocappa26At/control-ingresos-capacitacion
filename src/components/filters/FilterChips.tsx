'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, X } from 'lucide-react';
import { useDataStore } from '@/store/useDataStore';
import { describeActiveFilters } from '@/lib/filterDescriptions';
import { cn } from '@/lib/utils';

const MAX_CHIPS = 3;

export function FilterChips() {
  const filters = useDataStore((s) => s.filters);
  const setFilters = useDataStore((s) => s.setFilters);
  const resetFilters = useDataStore((s) => s.resetFilters);
  const openFilterDrawer = useDataStore((s) => s.openFilterDrawer);

  const chips = useMemo(() => describeActiveFilters(filters), [filters]);
  if (chips.length === 0) return null;

  const visible = chips.slice(0, MAX_CHIPS);
  const hidden = chips.length - visible.length;

  return (
    <div className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-hidden lg:flex">
      <AnimatePresence initial={false}>
        {visible.map((chip) => (
          <motion.span
            key={chip.id}
            layout
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            title={chip.label}
            className="group/chip flex max-w-[11rem] shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface-3/70 py-1 pr-1 pl-2 text-xs font-semibold whitespace-nowrap text-ink-muted transition-colors duration-200 hover:border-brand-400/50 hover:text-ink"
          >
            {chip.kind === 'date' && <Calendar className="size-3 shrink-0 text-brand-400" />}
            <span className="truncate">{chip.short}</span>
            <button
              type="button"
              onClick={() => setFilters(chip.remove(filters))}
              aria-label={`Quitar filtro: ${chip.label}`}
              className="flex size-4 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-[#e30613]/20 hover:text-[#ff8a8a]"
            >
              <X className="size-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>

      {hidden > 0 && (
        <button
          type="button"
          onClick={openFilterDrawer}
          title={`Ver los ${chips.length} filtros aplicados`}
          className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface-3/70 text-[10px] font-bold text-ink-muted tabular-nums transition-all duration-200 hover:border-brand-400/50 hover:text-brand-300"
        >
          +{hidden}
        </button>
      )}

      <button
        type="button"
        onClick={resetFilters}
        aria-label="Limpiar todos los filtros"
        className={cn(
          'flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-soft transition-all duration-200',
          'hover:bg-[#e30613]/15 hover:text-[#ff8a8a]',
        )}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
