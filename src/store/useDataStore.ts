'use client';

import { create } from 'zustand';
import type { FilterState, Promotor, UploadMeta } from '@/types';
import { matchesDateFilter } from '@/lib/dates';
import { normalizeKey, splitCapacitadores } from '@/lib/utils';

export const EMPTY_FILTERS: FilterState = {
  jurisdiccion: [],
  fechaIngreso: { type: 'all' },
  zonaComercial: [],
  sede: [],
  distrito: [],
  tienda: [],
  supervisor: [],
  responsableAS: [],
  modalidad: '',
  capacitador: [],
  inicioCapacitacion: { type: 'all' },
  finCapacitacion: { type: 'all' },
  entregaOperaciones: { type: 'all' },
  pasaAOperaciones: '',
  motivoCaida: '',
  subMotivoCaida: '',
};

interface DataState {
  records: Promotor[];
  filters: FilterState;
  searchTerm: string;
  activeFiltersCount: number;
  uploadMeta: UploadMeta | null;
  isProcessing: boolean;
  sidebarCollapsed: boolean;
  filterDrawerOpen: boolean;

  setRecords: (records: Promotor[], meta: UploadMeta) => void;
  clearData: () => void;
  setFilters: (filters: FilterState) => void;
  resetFilters: () => void;
  setSearchTerm: (term: string) => void;
  setIsProcessing: (value: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  openFilterDrawer: () => void;
  closeFilterDrawer: () => void;
  toggleFilterDrawer: () => void;
  loadStartedAt: number;
  setLoadStartedAt: (at: number) => void;
}

function hasActiveFilter(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (value && typeof value === 'object' && 'type' in value) {
    return (value as { type: string }).type !== 'all';
  }
  return Boolean(value);
}

function countActiveFilters(filters: FilterState): number {
  return Object.entries(filters).reduce((acc, [key, value]) => {
    if (key === 'fechaIngreso' || key === 'inicioCapacitacion' || key === 'finCapacitacion' || key === 'entregaOperaciones') {
      return acc + (value && value.type !== 'all' ? 1 : 0);
    }
    if (Array.isArray(value)) return acc + value.length;
    return acc + (hasActiveFilter(value) ? 1 : 0);
  }, 0);
}

export const useDataStore = create<DataState>((set) => ({
  records: [],
  filters: { ...EMPTY_FILTERS },
  searchTerm: '',
  activeFiltersCount: 0,
  uploadMeta: null,
  isProcessing: false,
  sidebarCollapsed: false,
  filterDrawerOpen: false,

  setRecords: (records, meta) =>
    set({
      records,
      uploadMeta: meta,
      isProcessing: false,
      filters: { ...EMPTY_FILTERS },
      activeFiltersCount: 0,
      searchTerm: '',
    }),

  clearData: () =>
    set({
      records: [],
      uploadMeta: null,
      filters: { ...EMPTY_FILTERS },
      activeFiltersCount: 0,
      searchTerm: '',
    }),

  setFilters: (filters) =>
    set({ filters, activeFiltersCount: countActiveFilters(filters) }),

  resetFilters: () =>
    set({ filters: { ...EMPTY_FILTERS }, activeFiltersCount: 0 }),

  setSearchTerm: (term) => set({ searchTerm: term }),

  setIsProcessing: (value) => set({ isProcessing: value }),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),

  openFilterDrawer: () => set({ filterDrawerOpen: true }),

  closeFilterDrawer: () => set({ filterDrawerOpen: false }),

  toggleFilterDrawer: () => set((s) => ({ filterDrawerOpen: !s.filterDrawerOpen })),
  loadStartedAt: 0,
  setLoadStartedAt: (at) => set({ loadStartedAt: at }),
}));

export function selectFilteredRecords(input: {
  records: Promotor[];
  filters: FilterState;
  searchTerm: string;
}): Promotor[] {
  const { records, filters, searchTerm } = input;

  function matchesCapacitadores(r: Promotor, selected: string[]): boolean {
    if (!selected.length) return true;
    const tokens = splitCapacitadores(r.capacitador);
    if (!tokens.length) return false;
    return selected.some((sel) =>
      tokens.some((tok) => tok === sel || tok.includes(sel) || sel.includes(tok)),
    );
  }

  function matchesSearch(r: Promotor): boolean {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return [r.dni, r.apellidosNombres, r.nombreTienda, r.supervisor, r.capacitador, r.distrito, r.sede]
      .some((val) => val.toLowerCase().includes(term));
  }

  function matches(r: Promotor): boolean {
    const f = filters;

    const inList = (selected: string[], value: string) => selected.length === 0 || selected.includes(value);
    const inNormalized = (selected: string[], value: string) =>
      selected.length === 0 || selected.includes(normalizeKey(value));
    const is = (selected: string, value: string) => !selected || selected === value;

    if (!inList(f.jurisdiccion, r.jurisdiccion)) return false;
    if (!inNormalized(f.zonaComercial, r.zonaComercial)) return false;
    if (!inList(f.sede, r.sede)) return false;
    if (!inList(f.distrito, r.distrito)) return false;
    if (!inList(f.tienda, r.nombreTienda)) return false;
    if (!inList(f.supervisor, r.supervisor)) return false;
    if (!inList(f.responsableAS, r.responsableAS)) return false;
    if (!is(f.modalidad, r.modalidad)) return false;
    if (f.capacitador.length > 0 && !matchesCapacitadores(r, f.capacitador)) return false;

    if (f.pasaAOperaciones) {
      const value = f.pasaAOperaciones;
      if (value === 'Pendiente' && r.pasaAOperaciones !== null) return false;
      if (value === '1' && r.pasaAOperaciones !== 1) return false;
      if (value === '0' && r.pasaAOperaciones !== 0) return false;
    }

    if (f.motivoCaida && r.motivoCaida !== f.motivoCaida) return false;
    if (f.subMotivoCaida && r.subMotivoCaida !== f.subMotivoCaida) return false;

    const dfi = r.fechasISO.fechaIngreso;
    const din = r.fechasISO.inicio;
    const dfin = r.fechasISO.fin;
    const dent = r.fechasISO.entrega;

    if (f.fechaIngreso.type !== 'all') {
      if (!dfi || !matchesDateFilter(dfi, f.fechaIngreso)) return false;
    }
    if (f.inicioCapacitacion.type !== 'all') {
      if (!din || !matchesDateFilter(din, f.inicioCapacitacion)) return false;
    }
    if (f.finCapacitacion.type !== 'all') {
      if (!dfin || !matchesDateFilter(dfin, f.finCapacitacion)) return false;
    }
    if (f.entregaOperaciones.type !== 'all') {
      if (!dent || !matchesDateFilter(dent, f.entregaOperaciones)) return false;
    }

    return true;
  }

  return records.filter((r) => matches(r) && matchesSearch(r));
}