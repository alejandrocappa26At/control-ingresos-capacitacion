import { normalizeKey } from '@/lib/utils';
import { MAX_DAYS } from '@/lib/constants';
import { diasEntre, todayISO } from '@/lib/dates';
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

export interface MomentoSalida {
  name: string;
  value: number;
  porcentaje: number;
}

export function caidasPorMomentoSalida(records: Promotor[]): MomentoSalida[] {
  const caidasList = caidas(records);
  const total = caidasList.length;
  const diaCounts = new Map<number, number>();
  let nunca = 0;
  for (const r of caidasList) {
    if (r.totalDias == null || r.totalDias === 0) {
      nunca += 1;
      continue;
    }
    diaCounts.set(r.totalDias, (diaCounts.get(r.totalDias) ?? 0) + 1);
  }

  const result: MomentoSalida[] = [];
  result.push({
    name: 'Nunca asistió',
    value: nunca,
    porcentaje: total > 0 ? (nunca / total) * 100 : 0,
  });
  for (let d = 1; d <= MAX_DAYS; d++) {
    const value = diaCounts.get(d) ?? 0;
    result.push({
      name: `Día ${d}`,
      value,
      porcentaje: total > 0 ? (value / total) * 100 : 0,
    });
  }
  return result;
}

export interface CaidaDimensionDia {
  name: string;
  dia: number | null;
  diaPromedio: number | null;
  cantidad: number;
  total: number;
}

export function caidasPorDiaPorDimension(
  records: Promotor[],
  getter: (r: Promotor) => string,
): CaidaDimensionDia[] {
  const byDim = new Map<string, Map<number, number>>();
  for (const r of caidas(records)) {
    const norm = normalizeKey(getter(r));
    if (!norm || norm === '—' || r.totalDias == null || r.totalDias === 0) continue;
    if (!byDim.has(norm)) byDim.set(norm, new Map());
    const byDay = byDim.get(norm)!;
    byDay.set(r.totalDias, (byDay.get(r.totalDias) ?? 0) + 1);
  }

  const result: CaidaDimensionDia[] = [];
  for (const [name, byDay] of byDim) {
    let dia: number | null = null;
    let cantidad = 0;
    let total = 0;
    let sumaDias = 0;
    for (const [d, c] of byDay) {
      total += c;
      sumaDias += d * c;
      if (c > cantidad) {
        cantidad = c;
        dia = d;
      }
    }
    result.push({ name, dia, diaPromedio: total > 0 ? sumaDias / total : null, cantidad, total });
  }

  return result.sort((a, b) => b.cantidad - a.cantidad || b.total - a.total);
}

export function caidasPorDiaPorSede(records: Promotor[]): CaidaDimensionDia[] {
  return caidasPorDiaPorDimension(records, (r) => r.sede);
}

export function caidasPorDiaPorSupervisor(records: Promotor[]): CaidaDimensionDia[] {
  return caidasPorDiaPorDimension(records, (r) => r.supervisor);
}

export interface EmbudoCapacitacion {
  totalIngresos: number;
  inicianCapacitacion: number;
  inicianPct: number;
  desercion: number;
  desercionPct: number;
  bajas: number;
  bajasPct: number;
  pasanOperaciones: number;
  pasanPct: number;
  enCapacitacion: number;
  enCapacitacionPct: number;
  integridad: boolean;
  diferencia: number;
}

export function computeEmbudo(records: Promotor[]): EmbudoCapacitacion {
  const totalIngresos = records.length;
  let inicianCapacitacion = 0;
  let desercion = 0;
  let bajas = 0;
  let pasanOperaciones = 0;
  let enCapacitacion = 0;

  for (const r of records) {
    if (r.totalDias != null && r.totalDias >= 1) inicianCapacitacion += 1;
    if (r.pasaAOperaciones === 1) {
      pasanOperaciones += 1;
    } else if (r.pasaAOperaciones === 0) {
      if (r.totalDias != null && r.totalDias >= 1) bajas += 1;
      else desercion += 1;
    } else {
      enCapacitacion += 1;
    }
  }

  const suma = desercion + bajas + pasanOperaciones + enCapacitacion;
  const pct = (n: number) => (totalIngresos > 0 ? (n / totalIngresos) * 100 : 0);

  return {
    totalIngresos,
    inicianCapacitacion,
    inicianPct: pct(inicianCapacitacion),
    desercion,
    desercionPct: pct(desercion),
    bajas,
    bajasPct: pct(bajas),
    pasanOperaciones,
    pasanPct: pct(pasanOperaciones),
    enCapacitacion,
    enCapacitacionPct: pct(enCapacitacion),
    integridad: suma === totalIngresos,
    diferencia: totalIngresos - suma,
  };
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

export function promotoresRiesgoDesaprobacion(records: Promotor[]): Promotor[] {
  const hoy = todayISO();
  return records.filter((r) => {
    if (r.resultado !== 'PENDIENTE') return false;
    if (r.estado !== 'EN_CAPACITACION') return false;
    if (!r.fechasISO.inicio) return false;
    const diasTranscurridos = diasEntre(r.fechasISO.inicio, hoy);
    const tieneFin = Boolean(r.fechasISO.fin);
    const avance = tieneFin ? diasEntre(r.fechasISO.inicio, r.fechasISO.fin) : 10;
    if (avance <= 0) return false;
    const progreso = diasTranscurridos / avance;
    const esperado = Math.round(progreso * 10);
    return esperado >= 3 && r.diasAsistidos < esperado - 1;
  });
}

export type NivelRiesgo = 'bajo' | 'medio' | 'alto';

export interface RiesgoDesaprobacion {
  enRiesgo: number;
  enCapacitacion: number;
  pct: number;
  promedioAsistencia: number;
  nivel: NivelRiesgo;
  ids: string[];
}

export function analizarRiesgoDesaprobacion(records: Promotor[]): RiesgoDesaprobacion {
  const enCapacitacion = records.filter((r) => r.estado === 'EN_CAPACITACION');
  const enRiesgo = promotoresRiesgoDesaprobacion(enCapacitacion);
  const promedioAsistencia =
    enRiesgo.length > 0 ? enRiesgo.reduce((acc, r) => acc + r.diasAsistidos, 0) / enRiesgo.length : 0;

  let nivel: NivelRiesgo = 'bajo';
  if (enRiesgo.length > 5) nivel = 'alto';
  else if (enRiesgo.length > 0) nivel = 'medio';

  return {
    enRiesgo: enRiesgo.length,
    enCapacitacion: enCapacitacion.length,
    pct: enCapacitacion.length > 0 ? (enRiesgo.length / enCapacitacion.length) * 100 : 0,
    promedioAsistencia,
    nivel,
    ids: enRiesgo.map((r) => r.id),
  };
}