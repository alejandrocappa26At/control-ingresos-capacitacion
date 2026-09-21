'use client';

import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { MultiSelectFilter } from '@/components/filters/MultiSelectFilter';
import { useCapacitadorOptions } from '@/components/filters/fields';
import { useDataStore } from '@/store/useDataStore';
import { splitCapacitadores } from '@/lib/utils';

interface CapacitadorMultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  options: string[];
}

function useEffectiveOptions(options: string[]): string[] {
  const records = useDataStore((s) => s.records);
  return useMemo(() => {
    if (options.length > 0) return options;
    const set = new Set<string>();
    for (const r of records) {
      for (const token of splitCapacitadores(r.capacitador)) set.add(token);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [options, records]);
}

export function CapacitadorMultiSelect({ value, onChange, options }: CapacitadorMultiSelectProps) {
  const effective = useEffectiveOptions(options);
  return (
    <MultiSelectFilter
      value={value}
      onChange={onChange}
      options={effective}
      icon={Users}
      emptyLabel="Todos los capacitadores"
      searchPlaceholder="Buscar capacitador..."
      countToken="capacitadores"
    />
  );
}

export { useCapacitadorOptions };