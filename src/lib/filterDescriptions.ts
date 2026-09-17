import type { DateFilterValue, FilterState } from '@/types';
import { ddmmyyyy, monthChipLabel } from '@/lib/dates';

export interface FilterChip {
  id: string;
  label: string;
  kind?: 'date';
  remove: (filters: FilterState) => FilterState;
}

const DATE_FIELD_LABELS: Record<DateFilterKey, string> = {
  fechaIngreso: 'Fecha de ingreso',
  inicioCapacitacion: 'Inicio capacitación',
  finCapacitacion: 'Fin capacitación',
  entregaOperaciones: 'Entrega operaciones',
};

type DateFilterKey = 'fechaIngreso' | 'inicioCapacitacion' | 'finCapacitacion' | 'entregaOperaciones';

const DATE_FIELD_KEYS: DateFilterKey[] = [
  'fechaIngreso',
  'inicioCapacitacion',
  'finCapacitacion',
  'entregaOperaciones',
];

function dateChipLabel(value: DateFilterValue): string | null {
  switch (value.type) {
    case 'day':
      return value.day ? ddmmyyyy(value.day) : null;
    case 'month':
      return value.month ? monthChipLabel(value.month) : null;
    case 'year':
      return value.year ?? null;
    case 'range':
      if (!value.from && !value.to) return null;
      return `${value.from ? ddmmyyyy(value.from) : '…'} → ${value.to ? ddmmyyyy(value.to) : '…'}`;
    default:
      return null;
  }
}

function textValue(filters: FilterState, key: keyof FilterState): string {
  const value = filters[key];
  return typeof value === 'string' ? value : '';
}

export function describeActiveFilters(filters: FilterState): FilterChip[] {
  const chips: FilterChip[] = [];

  const pushText = (key: keyof FilterState, shortLabel: string) => {
    const value = textValue(filters, key).trim();
    if (!value) return;
    chips.push({
      id: `${key}:${value}`,
      label: `${shortLabel}: ${value}`,
      remove: (f) => ({ ...f, [key]: '' } as FilterState),
    });
  };

  pushText('jurisdiccion', 'Jurisdicción');
  pushText('zonaComercial', 'Zona comercial');
  pushText('sede', 'Sede');
  pushText('distrito', 'Distrito');
  pushText('tienda', 'Tienda');
  pushText('supervisor', 'Supervisor');
  pushText('responsableAS', 'Responsable A&S');
  pushText('modalidad', 'Modalidad');

  for (const key of DATE_FIELD_KEYS) {
    const value = filters[key];
    const label = dateChipLabel(value);
    if (!label) continue;
    const prefix = key === 'fechaIngreso' ? '' : `${DATE_FIELD_LABELS[key]}: `;
    chips.push({
      id: `${key}:${value.type}`,
      label: `${prefix}${label}`,
      kind: 'date',
      remove: (f) => ({ ...f, [key]: { type: 'all' } } as FilterState),
    });
  }

  for (const name of filters.capacitador) {
    chips.push({
      id: `capacitador:${name}`,
      label: `Capacitador: ${name}`,
      remove: (f) => ({ ...f, capacitador: f.capacitador.filter((n) => n !== name) }),
    });
  }

  if (filters.pasaAOperaciones) {
    const label =
      filters.pasaAOperaciones === '1'
        ? 'Pasa a operaciones: Sí'
        : filters.pasaAOperaciones === '0'
          ? 'Pasa a operaciones: No'
          : 'Pasa a operaciones: Pendiente';
    chips.push({
      id: `pasaAOperaciones:${filters.pasaAOperaciones}`,
      label,
      remove: (f) => ({ ...f, pasaAOperaciones: '' }),
    });
  }

  pushText('motivoCaida', 'Motivo de caída');
  pushText('subMotivoCaida', 'Submotivo de caída');

  return chips;
}

export function activeFiltersOf(filters: FilterState, keys: Array<keyof FilterState>): number {
  return keys.reduce((acc, key) => {
    const value = filters[key];
    if (Array.isArray(value)) return acc + (value.length > 0 ? 1 : 0);
    if (value && typeof value === 'object' && 'type' in value) return acc + (value.type !== 'all' ? 1 : 0);
    return acc + (typeof value === 'string' && value.trim().length > 0 ? 1 : 0);
  }, 0);
}