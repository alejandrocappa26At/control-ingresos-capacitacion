import type { DateFilterValue, FilterState } from '@/types';
import { ddmmyyyy, monthChipLabel } from '@/lib/dates';

export interface FilterChip {
  id: string;
  label: string;
  short: string;
  kind?: 'date';
  remove: (filters: FilterState) => FilterState;
}

const DATE_FIELD_LABELS: Record<DateFilterKey, string> = {
  fechaIngreso: 'Fecha de ingreso',
  finCapacitacion: 'Fin capacitación',
  entregaOperaciones: 'Entrega operaciones',
};

type DateFilterKey = 'fechaIngreso' | 'finCapacitacion' | 'entregaOperaciones';

const DATE_FIELD_KEYS: DateFilterKey[] = ['fechaIngreso', 'finCapacitacion', 'entregaOperaciones'];

export const PASA_A_OPERACIONES_LABELS: Record<string, string> = {
  '1': 'Pasa a operaciones',
  '0': 'No pasa',
  Pendiente: 'Pendiente',
};

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

const MULTI_FIELDS: Array<{ key: keyof FilterState; label: string }> = [
  { key: 'jurisdiccion', label: 'Jurisdicción' },
  { key: 'zonaComercial', label: 'Zona comercial' },
  { key: 'sede', label: 'Sede' },
  { key: 'distrito', label: 'Distrito' },
  { key: 'tienda', label: 'Tienda' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'responsableAS', label: 'Responsable A&S' },
];

function textValue(filters: FilterState, key: keyof FilterState): string {
  const value = filters[key];
  return typeof value === 'string' ? value : '';
}

export function describeActiveFilters(filters: FilterState): FilterChip[] {
  const chips: FilterChip[] = [];

  for (const { key, label } of MULTI_FIELDS) {
    const values = filters[key] as string[];
    for (const value of values) {
      chips.push({
        id: `${key}:${value}`,
        label: `${label}: ${value}`,
        short: value,
        remove: (f) => ({ ...f, [key]: (f[key] as string[]).filter((v) => v !== value) } as FilterState),
      });
    }
  }

  const pushText = (key: keyof FilterState, shortLabel: string) => {
    const value = textValue(filters, key).trim();
    if (!value) return;
    chips.push({
      id: `${key}:${value}`,
      label: `${shortLabel}: ${value}`,
      short: value,
      remove: (f) => ({ ...f, [key]: '' } as FilterState),
    });
  };

  pushText('modalidad', 'Modalidad');

  for (const key of DATE_FIELD_KEYS) {
    const value = filters[key];
    const label = dateChipLabel(value);
    if (!label) continue;
    const prefix = key === 'fechaIngreso' ? '' : `${DATE_FIELD_LABELS[key]}: `;
    chips.push({
      id: `${key}:${value.type}`,
      label: `${prefix}${label}`,
      short: label,
      kind: 'date',
      remove: (f) => ({ ...f, [key]: { type: 'all' } } as FilterState),
    });
  }

  for (const name of filters.capacitador) {
    chips.push({
      id: `capacitador:${name}`,
      label: `Capacitador: ${name}`,
      short: name,
      remove: (f) => ({ ...f, capacitador: f.capacitador.filter((n) => n !== name) }),
    });
  }

  for (const value of filters.pasaAOperaciones) {
    const label = PASA_A_OPERACIONES_LABELS[value] ?? value;
    chips.push({
      id: `pasaAOperaciones:${value}`,
      label: `Pasa a operaciones: ${label}`,
      short: label,
      remove: (f) => ({ ...f, pasaAOperaciones: f.pasaAOperaciones.filter((v) => v !== value) }),
    });
  }

  for (const value of filters.motivoCaida) {
    chips.push({
      id: `motivoCaida:${value}`,
      label: `Motivo de caída: ${value}`,
      short: value,
      remove: (f) => ({ ...f, motivoCaida: f.motivoCaida.filter((v) => v !== value) }),
    });
  }

  for (const value of filters.subMotivoCaida) {
    chips.push({
      id: `subMotivoCaida:${value}`,
      label: `Submotivo de caída: ${value}`,
      short: value,
      remove: (f) => ({ ...f, subMotivoCaida: f.subMotivoCaida.filter((v) => v !== value) }),
    });
  }

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