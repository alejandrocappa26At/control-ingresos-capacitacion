import { normalizeKey } from '@/lib/utils';
import type { CaidaRanking, Promotor } from '@/types';

export function caidas(records: Promotor[]): Promotor[] {
  return records.filter((r) => r.pasaAOperaciones === 0);
}

export function rankingPorMotivo(records: Promotor[]): CaidaRanking[] {
  const caidasList = caidas(records);
  const map = new Map<string, number>();
  for (const r of caidasList) {
    const key = r.motivoCaida || '—';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const total = caidasList.length;
  return Array.from(map.entries())
    .map(([motivo, cantidad]) => ({
      motivo,
      cantidad,
      porcentaje: total > 0 ? (cantidad / total) * 100 : 0,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

export function rankingPorSubMotivo(records: Promotor[]): CaidaRanking[] {
  const caidasList = caidas(records);
  const map = new Map<string, number>();
  for (const r of caidasList) {
    const key = r.subMotivoCaida || '—';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const total = caidasList.length;
  return Array.from(map.entries())
    .map(([subMotivo, cantidad]) => ({
      motivo: subMotivo,
      cantidad,
      porcentaje: total > 0 ? (cantidad / total) * 100 : 0,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

export interface DimensionAnalysis {
  name: string;
  caidas: number;
  aprobados: number;
  pendientes: number;
  total: number;
  pctCaida: number;
  pctDelTotal: number;
}

export function analisisPorDimension(
  records: Promotor[],
  getter: (r: Promotor) => string,
): DimensionAnalysis[] {
  const totalCaidas = caidas(records).length;
  const map = new Map<string, DimensionAnalysis>();

  for (const r of records) {
    const norm = normalizeKey(getter(r));
    if (!norm || norm === '—') continue;
    let entry = map.get(norm);
    if (!entry) {
      entry = { name: norm, caidas: 0, aprobados: 0, pendientes: 0, total: 0, pctCaida: 0, pctDelTotal: 0 };
      map.set(norm, entry);
    }
    entry.total += 1;
    if (r.pasaAOperaciones === 0) entry.caidas += 1;
    else if (r.pasaAOperaciones === 1) entry.aprobados += 1;
    else entry.pendientes += 1;
  }

  return Array.from(map.values()).map((entry) => ({
    ...entry,
    pctCaida: entry.total > 0 ? (entry.caidas / entry.total) * 100 : 0,
    pctDelTotal: totalCaidas > 0 ? (entry.caidas / totalCaidas) * 100 : 0,
  }));
}

export function caidasPorSede(records: Promotor[]): DimensionAnalysis[] {
  return analisisPorDimension(records, (r) => r.sede);
}

export function caidasPorSupervisor(records: Promotor[]): DimensionAnalysis[] {
  return analisisPorDimension(records, (r) => r.supervisor);
}

export interface HeatCell {
  supervisor: string;
  sede: string;
  caidas: number;
  aprobados: number;
  pendientes: number;
  pctDelTotal: number;
}

export interface CaidasHeatmap {
  sedes: string[];
  supervisores: string[];
  rows: HeatCell[][];
}

export function analizarHeatmap(records: Promotor[]): CaidasHeatmap {
  const totalCaidas = caidas(records).length;
  const map = new Map<string, HeatCell>();
  const key = (sup: string, sede: string) => `${sup}\u0000${sede}`;

  for (const r of records) {
    const sup = normalizeKey(r.supervisor);
    const sede = normalizeKey(r.sede);
    if (!sup || !sede || sup === '—' || sede === '—') continue;
    const cellKey = key(sup, sede);
    let cell = map.get(cellKey);
    if (!cell) {
      cell = { supervisor: sup, sede, caidas: 0, aprobados: 0, pendientes: 0, pctDelTotal: 0 };
      map.set(cellKey, cell);
    }
    if (r.pasaAOperaciones === 0) cell.caidas += 1;
    else if (r.pasaAOperaciones === 1) cell.aprobados += 1;
    else cell.pendientes += 1;
  }

  const supTotals = new Map<string, number>();
  const sedeTotals = new Map<string, number>();
  for (const cell of map.values()) {
    supTotals.set(cell.supervisor, (supTotals.get(cell.supervisor) ?? 0) + cell.caidas);
    sedeTotals.set(cell.sede, (sedeTotals.get(cell.sede) ?? 0) + cell.caidas);
  }

  const supervisores = Array.from(supTotals.entries())
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const sedes = Array.from(sedeTotals.entries())
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const rows = supervisores.map((sup) =>
    sedes.map((sede) => {
      const cell = map.get(key(sup, sede));
      return {
        supervisor: sup,
        sede,
        caidas: cell?.caidas ?? 0,
        aprobados: cell?.aprobados ?? 0,
        pendientes: cell?.pendientes ?? 0,
        pctDelTotal: totalCaidas > 0 ? ((cell?.caidas ?? 0) / totalCaidas) * 100 : 0,
      };
    }),
  );

  return { sedes, supervisores, rows };
}